//! The working glow on a real page view: layers present and removed,
//! input passing through, the page unchanged, the light travelling in the
//! render server and not in the app, and a captured image of it on a light
//! and a dark page under `target/look/assist-glow/`. Then on a page hosted
//! the way the app hosts a Browse tab (a rounded page in a content stage):
//! the light is in the window server's composite, and a short run of steps
//! is still seen.
//!
//! The probe window is ordered in far outside every display, so the window
//! server composites it (and its cost can be measured) without it ever
//! appearing on screen.

use std::sync::atomic::AtomicBool;
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};

use objc2_app_kit::{NSBitmapImageFileType, NSBitmapImageRep, NSEventType};
#[allow(deprecated)]
use objc2_core_graphics::CGWindowListCreateImage;
use objc2_core_graphics::{CGRectNull, CGWindowImageOption, CGWindowListOption};
use objc2_foundation::{MainThreadMarker, NSDate, NSDictionary, NSPoint, NSRunLoop, NSSize};

use super::{check, settle, Fixture, Probe};
use crate::page_reader::PageGlow;
use crate::platform::macos::page_glow;

fn cpu_self_ns() -> u64 {
    // SAFETY: getrusage fills the zeroed struct for this process.
    let mut usage: libc::rusage = unsafe { std::mem::zeroed() };
    unsafe { libc::getrusage(libc::RUSAGE_SELF, &mut usage) };
    let ns = |t: libc::timeval| t.tv_sec as u64 * 1_000_000_000 + t.tv_usec as u64 * 1_000;
    ns(usage.ru_utime) + ns(usage.ru_stime)
}

fn footprint_self() -> u64 {
    // SAFETY: proc_pid_rusage fills the zeroed V2 record for this process.
    let mut info: libc::rusage_info_v2 = unsafe { std::mem::zeroed() };
    let filled = unsafe {
        libc::proc_pid_rusage(
            libc::getpid(),
            libc::RUSAGE_INFO_V2,
            std::ptr::addr_of_mut!(info).cast(),
        )
    };
    if filled == 0 {
        info.ri_phys_footprint
    } else {
        0
    }
}

/// WindowServer's accumulated CPU time, read with `ps` (no privilege).
fn window_server_cpu_ms() -> Option<f64> {
    let pid = std::process::Command::new("pgrep")
        .arg("-x")
        .arg("WindowServer")
        .output()
        .ok()?;
    let pid = String::from_utf8_lossy(&pid.stdout)
        .lines()
        .next()?
        .trim()
        .to_owned();
    let out = std::process::Command::new("ps")
        .args(["-o", "time=", "-p", &pid])
        .output()
        .ok()?;
    let time = String::from_utf8_lossy(&out.stdout).trim().to_owned();
    let mut seconds = 0.0;
    for part in time.split(':') {
        seconds = seconds * 60.0 + part.parse::<f64>().ok()?;
    }
    Some(seconds * 1_000.0)
}

/// Runs the main run loop for `duration` without polling.
fn idle(duration: Duration) {
    let run_loop = NSRunLoop::mainRunLoop();
    let end = Instant::now() + duration;
    while Instant::now() < end {
        objc2::rc::autoreleasepool(|_| {
            run_loop.runUntilDate(&NSDate::dateWithTimeIntervalSinceNow(
                (end - Instant::now()).as_secs_f64().min(0.5),
            ));
        });
    }
}

impl Probe {
    // The window server's own composite of this window is what the person
    // would see; nothing else captures the render server's layers.
    #[allow(deprecated)]
    fn composite(&self) -> Result<objc2::rc::Retained<NSBitmapImageRep>, String> {
        let number = u32::try_from(self._window.windowNumber()).map_err(|_| "window number")?;
        // SAFETY: an immutable framework constant.
        let image = CGWindowListCreateImage(
            unsafe { CGRectNull },
            CGWindowListOption::OptionIncludingWindow,
            number,
            CGWindowImageOption::BoundsIgnoreFraming | CGWindowImageOption::BestResolution,
        )
        .ok_or("the window server gave no image")?;
        Ok(NSBitmapImageRep::initWithCGImage(
            <NSBitmapImageRep as objc2::AnyThread>::alloc(),
            &image,
        ))
    }

    fn capture(&self, path: &std::path::Path) -> Result<(), String> {
        let rep = self.composite()?;
        // SAFETY: PNG takes no properties; the dictionary is empty.
        let png = unsafe {
            rep.representationUsingType_properties(NSBitmapImageFileType::PNG, &NSDictionary::new())
        }
        .ok_or("no png")?;
        std::fs::create_dir_all(path.parent().ok_or("path")?).map_err(|e| e.to_string())?;
        std::fs::write(path, png.to_vec()).map_err(|e| e.to_string())
    }

    /// A click delivered through the window, so it reaches whatever view
    /// hit-testing finds at that point.
    fn window_click(&self, x: f64, y: f64) {
        let height = self._window.frame().size.height;
        for kind in [NSEventType::LeftMouseDown, NSEventType::LeftMouseUp] {
            let event = objc2_app_kit::NSEvent::mouseEventWithType_location_modifierFlags_timestamp_windowNumber_context_eventNumber_clickCount_pressure(
                kind,
                NSPoint::new(x, height - y),
                objc2_app_kit::NSEventModifierFlags::empty(),
                0.0,
                self._window.windowNumber(),
                None,
                0,
                1,
                if kind == NSEventType::LeftMouseDown { 1.0 } else { 0.0 },
            );
            if let Some(event) = event {
                self._window.sendEvent(&event);
            }
            settle(Duration::from_millis(40));
        }
    }
}

fn field<'a>(report: &'a str, key: &str) -> &'a str {
    super::field(report, key)
}

pub(super) fn run(mtm: MainThreadMarker, fixture: &Fixture) -> Result<(), String> {
    let probe = Probe::new(mtm, true)?;
    // Ordered in far outside every display: composited, never seen.
    probe
        ._window
        .setFrameOrigin(NSPoint::new(-30_000.0, -30_000.0));
    probe._window.orderFrontRegardless();
    let view = super::super::native_webview(&probe.view);
    let tab = probe.tab;
    let look =
        std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("../../target/look/assist-glow");
    let mut measured = Vec::new();

    for (path, tone) in [("/listing", "light"), ("/feed", "dark")] {
        println!("glow: on a {tone} page");
        let url = fixture.url(path);
        probe.load(&url)?;
        settle(Duration::from_millis(300));
        let before = probe.assist_report(&url, "r", "before", "")?;
        let memory = footprint_self();
        page_glow::show_on(tab, &view, PageGlow::Working, false);
        settle(Duration::from_millis(400));
        let facts = page_glow::facts(tab).ok_or("no glow")?;
        check(
            facts.attached && facts.travelling && facts.fitted,
            &format!("a layer above the page, travelling, its band fitted ({facts:?})"),
        )?;
        let expected = if tone == "dark" { 0.68 } else { 0.55 };
        check(
            (facts.opacity - expected).abs() < 0.001,
            &format!("{tone} pages glow at {expected}"),
        )?;
        let content = probe._window.contentView().ok_or("content view")?;
        let hit = content.hitTest(NSPoint::new(400.0, 300.0));
        check(
            hit.is_some_and(|hit| hit.isDescendantOf(&view)),
            "hit-testing finds the page, not the glow",
        )?;
        probe.window_click(400.0, 300.0);
        let after = probe.assist_report(&url, "r", "after", "")?;
        check(
            field(&after, "clicks").parse::<u32>().unwrap_or(0)
                > field(&before, "clicks").parse::<u32>().unwrap_or(0),
            &format!(
                "a click through the window reaches the page ({})",
                field(&after, "clicks")
            ),
        )?;
        check(
            field(&after, "attrs") == "0"
                && field(&after, "inside") == "0"
                && field(&after, "added") == "none",
            &format!("the page's DOM is untouched ({after})"),
        )?;

        let grown = footprint_self().saturating_sub(memory);
        settle(Duration::from_millis(900));
        probe.capture(&look.join(format!("{tone}.png")))?;

        page_glow::show_on(tab, &view, PageGlow::Paused, false);
        settle(Duration::from_millis(400));
        let paused = page_glow::facts(tab).ok_or("no glow")?;
        check(
            !paused.travelling && paused.opacity < facts.opacity,
            &format!("paused holds still, dimmer ({paused:?})"),
        )?;
        probe.capture(&look.join(format!("{tone}-paused.png")))?;
        page_glow::show_on(tab, &view, PageGlow::Working, true);
        check(
            page_glow::facts(tab).is_some_and(|f| !f.travelling),
            "reduced motion holds it still",
        )?;
        page_glow::show_on(tab, &view, PageGlow::Off, false);
        settle(Duration::from_millis(1_600));
        let gone = page_glow::facts(tab);
        check(
            gone.is_some_and(|f| !f.attached),
            &format!("off holds, fades out, then removes the layer and its animations ({gone:?})"),
        )?;
        // Glowing and not, interleaved: the window server's own load
        // drifts with everything else on the machine.
        let (mut on, mut off) = (Vec::new(), Vec::new());
        for round in 0..12 {
            let glowing = round % 2 == 0;
            if glowing {
                page_glow::show_on(tab, &view, PageGlow::Working, false);
            } else {
                page_glow::forget(tab);
            }
            settle(Duration::from_millis(500));
            let server = window_server_cpu_ms();
            let cpu = cpu_self_ns();
            let wall = Instant::now();
            idle(Duration::from_secs(3));
            let seconds = wall.elapsed().as_secs_f64();
            let app = (cpu_self_ns() - cpu) as f64 / 1e6 / seconds / 10.0;
            let server = server
                .zip(window_server_cpu_ms())
                .map_or(f64::NAN, |(a, b)| (b - a) / seconds / 10.0);
            if glowing {
                on.push((app, server))
            } else {
                off.push((app, server))
            }
        }
        page_glow::forget(tab);
        let mean = |values: &[(f64, f64)], pick: fn(&(f64, f64)) -> f64| {
            values.iter().map(pick).sum::<f64>() / values.len() as f64
        };
        let spread = |values: &[(f64, f64)]| {
            let servers: Vec<f64> = values.iter().map(|v| v.1).collect();
            servers.iter().cloned().fold(f64::NAN, f64::max)
                - servers.iter().cloned().fold(f64::NAN, f64::min)
        };
        measured.push(format!(
            "{tone}: app CPU {:.2}% glowing vs {:.2}% not; WindowServer {:.2}% vs {:.2}% (spread {:.1} / {:.1}); app footprint +{} KB",
            mean(&on, |v| v.0),
            mean(&off, |v| v.0),
            mean(&on, |v| v.1),
            mean(&off, |v| v.1),
            spread(&on),
            spread(&off),
            grown / 1024
        ));
    }

    println!("glow: follows the view");
    page_glow::show_on(tab, &view, PageGlow::Working, false);
    probe._window.setContentSize(NSSize::new(820.0, 600.0));
    probe
        .view
        .set_bounds(wry::Rect {
            position: wry::dpi::LogicalPosition::new(0.0, 0.0).into(),
            size: wry::dpi::LogicalSize::new(820.0, 600.0).into(),
        })
        .map_err(|e| e.to_string())?;
    settle(Duration::from_millis(200));
    let facts = page_glow::facts(tab).ok_or("no glow")?;
    let bounds = view.bounds();
    check(
        facts.fitted
            && facts.bounds.size.width == bounds.size.width
            && facts.bounds.size.height == bounds.size.height,
        &format!("a resize moves the light with the edges ({facts:?})"),
    )?;
    view.setHidden(true);
    check(view.isHiddenOrHasHiddenAncestor(), "hidden with its view")?;
    view.setHidden(false);
    page_glow::forget(tab);
    check(
        page_glow::facts(tab).is_none()
            && view.layer().is_some_and(|layer| {
                // SAFETY: a main-thread read of the view's own layer tree.
                unsafe { layer.sublayers() }
                    .is_none_or(|layers| layers.iter().all(|layer| layer.zPosition() < 10_000.0))
            }),
        "closing the tab removes every layer",
    )?;
    probe._window.orderOut(None);
    for line in measured {
        println!("glow: {line}");
    }
    staged(mtm, fixture, &look)?;
    println!("glow: images in {}", look.display());
    Ok(())
}

static NOTES: Mutex<Vec<String>> = Mutex::new(Vec::new());

fn noted(fact: std::fmt::Arguments<'_>) {
    let line = fact.to_string();
    println!("  log   {line}");
    NOTES
        .lock()
        .unwrap_or_else(|poisoned| poisoned.into_inner())
        .push(line);
}

fn notes() -> Vec<String> {
    std::mem::take(
        &mut *NOTES
            .lock()
            .unwrap_or_else(|poisoned| poisoned.into_inner()),
    )
}

/// How far the window's composite at each edge point moved from `before`,
/// the largest channel difference at the weakest of the four edges.
fn edge_change(
    before: &NSBitmapImageRep,
    after: &NSBitmapImageRep,
    width: f64,
    height: f64,
) -> f64 {
    let scale = before.pixelsWide() as f64 / width;
    let inset = 1.8;
    [
        (inset, height / 2.0),
        (width - inset, height / 2.0),
        (width / 2.0, inset),
        (width / 2.0, height - inset),
    ]
    .iter()
    .map(|&(x, y)| {
        let at = ((x * scale) as isize, (y * scale) as isize);
        match (
            super::rgb(before, at.0, at.1),
            super::rgb(after, at.0, at.1),
        ) {
            (Some(a), Some(b)) => (a.0 - b.0)
                .abs()
                .max((a.1 - b.1).abs())
                .max((a.2 - b.2).abs()),
            _ => 0.0,
        }
    })
    .fold(f64::INFINITY, f64::min)
}

/// The page hosted as the app hosts a Browse tab: the web view leaves its
/// window's content view for a content stage, is rounded and outlined as
/// construction does, and is laid out and revealed by the stage.
fn staged(mtm: MainThreadMarker, fixture: &Fixture, look: &std::path::Path) -> Result<(), String> {
    use objc2_app_kit::NSAutoresizingMaskOptions as Mask;
    println!("glow: on a page hosted the way the app hosts a Browse tab");
    crate::page_reader::set_diagnostics(noted);
    let probe = Probe::new(mtm, true)?;
    probe
        ._window
        .setFrameOrigin(NSPoint::new(-30_000.0, -30_000.0));
    probe._window.orderFrontRegardless();
    let (width, height) = (1024.0, 768.0);
    let content = probe._window.contentView().ok_or("content view")?;
    let stage = crate::platform::macos::ContentStage::new(mtm, 8.0, Box::new(|_| {}));
    stage.setAutoresizingMask(Mask::ViewWidthSizable | Mask::ViewHeightSizable);
    content.addSubview(&stage);
    stage.cover_pointer();
    let page = super::super::native_webview(&probe.view);
    super::super::native::round_page(&page, 12.0);
    page.removeFromSuperview();
    let tab = probe.tab;
    let update = stage.begin_content_update(true).ok_or("stage update")?;
    stage.setFrame(objc2_foundation::NSRect::new(
        NSPoint::new(0.0, 0.0),
        NSSize::new(width, height),
    ));
    let native: objc2::rc::Retained<objc2_app_kit::NSView> =
        objc2::rc::Retained::into_super(page.clone());
    check(
        stage.insert_view(tab, native, Arc::new(AtomicBool::new(true)))
            && stage.set_ready(tab)
            && stage.set_tree(Some(zephium_core::split::Pane::leaf(tab)))
            && stage.set_visible(&[tab])
            && stage.finish_content_update(update),
        "the stage takes the page and lays it out",
    )?;
    let url = fixture.url("/listing");
    probe.load(&url)?;
    settle(Duration::from_millis(400));
    // SAFETY: a main-thread read of the page's own superview.
    let hosted = unsafe { page.superview() }
        .is_some_and(|parent| std::ptr::eq(&*parent, objc2::rc::Retained::as_ptr(&stage).cast()));
    check(
        hosted && !page.isHiddenOrHasHiddenAncestor(),
        "the page is the stage's own, shown",
    )?;
    let dark = probe.composite()?;
    page_glow::set(tab, &probe.view, PageGlow::Working, false);
    settle(Duration::from_millis(500));
    let lit = probe.composite()?;
    probe.capture(&look.join("staged.png"))?;
    let change = edge_change(&dark, &lit, width, height);
    check(
        change > 0.08,
        &format!(
            "the window server shows the light at all four edges (weakest edge moved {change:.3})"
        ),
    )?;
    let attached = notes();
    check(
        attached.iter().any(|line| {
            line.starts_with("page_glow attached")
                && line.contains("host=KestrelContentStage")
                && line.contains("window=true hidden=false visible=true")
        }),
        "the log says it attached, on the stage's page, shown",
    )?;
    page_glow::set(tab, &probe.view, PageGlow::Off, false);
    settle(Duration::from_millis(1_500));
    let gone = probe.composite()?;
    check(
        edge_change(&dark, &gone, width, height) < 0.02
            && page_glow::facts(tab).is_some_and(|facts| !facts.attached),
        "off takes it away",
    )?;

    println!("glow: a step shorter than the fade is still seen");
    let lines = notes();
    check(
        lines
            .iter()
            .any(|line| line.starts_with("page_glow removed") && line.contains("reason=off")),
        "the log says it was removed",
    )?;
    page_glow::set(tab, &probe.view, PageGlow::Working, false);
    settle(Duration::from_millis(150));
    page_glow::set(tab, &probe.view, PageGlow::Off, false);
    settle(Duration::from_millis(500));
    let held = probe.composite()?;
    let change = edge_change(&dark, &held, width, height);
    check(
        change > 0.08,
        &format!("half a second after a 150 ms run the light is still on (weakest edge moved {change:.3})"),
    )?;
    settle(Duration::from_millis(1_800));
    check(
        edge_change(&dark, &*probe.composite()?, width, height) < 0.02,
        "and then it fades out",
    )?;
    let shown = notes()
        .iter()
        .rev()
        .find_map(|line| {
            line.strip_prefix("page_glow removed")
                .and_then(|rest| rest.split("shown_ms=").nth(1))
                .and_then(|ms| ms.parse::<f64>().ok())
        })
        .unwrap_or(0.0);
    check(
        shown >= 1_300.0,
        &format!("it was seen for at least 1.3 s ({shown} ms)"),
    )?;
    page_glow::forget(tab);
    stage.remove_view(tab);
    stage.retire();
    probe._window.orderOut(None);
    Ok(())
}

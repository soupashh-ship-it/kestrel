// Prevents an extra console window on Windows in release.
#![cfg_attr(
    any(not(debug_assertions), feature = "webext-qa"),
    windows_subsystem = "windows"
)]

fn main() -> std::process::ExitCode {
    zephium_desktop_lib::run();
    std::process::ExitCode::SUCCESS
}

//! The actor shell around the pure core. One thread owns all state; commands
//! enter through a queue (UI intents and engine events alike), effects leave
//! through ports, projections go to the UI.

mod diagnostics;

macro_rules! diagnostic {
    ($($argument:tt)*) => {{
        crate::diagnostics::write(format_args!($($argument)*));
    }};
}

pub(crate) use diagnostic;

/// `AgentWorkFailure::Contract`, remembering where it was raised so a failed
/// page task names its cause in the log.
#[allow(unused_macros)]
macro_rules! contract_failure {
    () => {{
        AgentWorkFailure::Contract
    }};
}
#[allow(unused_imports)]
pub(crate) use contract_failure;

mod actor;
mod api;
mod lookup;
mod onboarding;
mod reply;
mod shell;
mod store_reads;

pub use actor::{
    spawn, spawn_suspended, CallbackHandle, ContentPolicyStatusRequest,
    FocusedContentPolicyStatusRequest, Handle, ShutdownRequest, SpawnError, SpawnFailure,
};
pub use api::{
    BrowserPage, ChromePresentation, ChromePresentationCallback, ChromePresentationDispatch,
    Command, ContentPolicyStatusQueryOutcome, EmitFn, PagePermissionPromptDecision,
    PageRequestDecision, PresentationChrome, SharedBlocker, SharedChrome, SharedEngine,
    SharedStore, ShellTerminalFailure, ShellTerminalFailureCallback, ShutdownOutcome, TabMetadata,
};
pub use lookup::{NoteMatch, TaskMatch};
pub use onboarding::{finish_onboarding, onboarding_due};
pub use shell::{Shell, WebExtensionStatus, WebExtensionTarget};

#[doc(hidden)]
pub use store_reads::{ImportWork, ImportedSite, StoreReadResult};

pub use api::{
    BookmarkCompletion, BrowsingDataCompletion, ExportCompletion, FaviconPageSource, FaviconProbe,
    FaviconProber, FaviconProberAttachment, HistoryCompletion, HistoryListCompletion,
    ImportCompletion, ImportDestination, ImportDestinationCompletion, NoteCompletion,
    NotesAttachment, PageSource, ResourceCompletion, SourceCompletion, SpaceCommand, TabAction,
    TabCompletion, TimeCompletion, ZoomCompletion,
};

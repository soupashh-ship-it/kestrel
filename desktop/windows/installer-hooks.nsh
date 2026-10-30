; Kestrel registers itself as a browser per user when asked to become the
; default (desktop/src/default_browser/windows.rs). Uninstalling removes that
; registration so Default apps never lists a browser that is gone.
!macro NSIS_HOOK_POSTINSTALL
  ; Kestrel 1.0.4 and earlier installed its executable as zephium-desktop.exe.
  ; Drop it so an update leaves only Kestrel.exe behind. Delete is a no-op while
  ; a process holds the file open, so an in-flight update never fails here.
  Delete "$INSTDIR\zephium-desktop.exe"
!macroend

!macro NSIS_HOOK_POSTUNINSTALL
  Delete "$INSTDIR\zephium-desktop.exe"
  DeleteRegKey HKCU "Software\Clients\StartMenuInternet\Kestrel"
  DeleteRegKey HKCU "Software\Classes\KestrelURL"
  DeleteRegValue HKCU "Software\RegisteredApplications" "Kestrel"
!macroend

; SnCode — Custom NSIS installer configuration
; Included by electron-builder via the "include" option in package.json

!macro customHeader
  ; ── Welcome page ──
  !ifndef MUI_WELCOMEPAGE_TITLE
    !define MUI_WELCOMEPAGE_TITLE "Welcome to SnCode"
  !endif
  !ifndef MUI_WELCOMEPAGE_TEXT
    !define MUI_WELCOMEPAGE_TEXT "SnCode is your AI-powered desktop coding agent.$\r$\n$\r$\nThis wizard will guide you through the installation.$\r$\nClick Next to continue."
  !endif

  ; ── Finish page ──
  !ifndef MUI_FINISHPAGE_TITLE
    !define MUI_FINISHPAGE_TITLE "SnCode is Ready"
  !endif
  !ifndef MUI_FINISHPAGE_TEXT
    !define MUI_FINISHPAGE_TEXT "SnCode has been installed successfully.$\r$\n$\r$\nClick Finish to close the wizard and start coding."
  !endif

  ; ── Abort warning ──
  !ifndef MUI_ABORTWARNING
    !define MUI_ABORTWARNING
  !endif
  !ifndef MUI_ABORTWARNING_TEXT
    !define MUI_ABORTWARNING_TEXT "Are you sure you want to cancel the SnCode installation?"
  !endif
!macroend

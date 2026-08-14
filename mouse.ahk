#Requires AutoHotkey v2.0
#SingleInstance Force
Persistent

CoordMode "Mouse", "Screen"
SendMode "Input"
SetMouseDelay -1

if A_Args.Length < 2 {
    MsgBox "Usage: mouse.ahk <dx> <dy>"
    ExitApp()
}

try {
    dx := Integer(A_Args[1])
    dy := Integer(A_Args[2])

    MouseMove dx, dy, 0, "R"

    ; Uncomment for debugging
    ; MsgBox "Moved: " dx ", " dy
}
catch Error as e {
    MsgBox "Error:`n" e.Message
}

ExitApp()
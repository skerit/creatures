VERSION 1.0 CLASS
BEGIN
  MultiUse = -1  'True
  Persistable = 0  'NotPersistable
  DataBindingBehavior = 0  'vbNone
  DataSourceBehavior  = 0  'vbNone
  MTSTransactionMode  = 0  'NotAnMTSObject
END
Attribute VB_Name = "Window"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = True
Attribute VB_PredeclaredId = False
Attribute VB_Exposed = False
Public handle As Long
Public proc_id As Long
Public thread_id As Long
Public title As String
Private Declare Function GetWindowThreadProcessId Lib "user32" (ByVal hwnd As Long, lpdwprocessid As Long) As Long
Private Declare Function sendMessageI Lib "user32" Alias "SendMessageW" (ByVal hwnd As Long, ByVal wMsg As Long, ByVal wParam As Long, lParam As Any) As Long
Private Declare Function moveWindowI Lib "user32" Alias "MoveWindow" (ByVal hwnd As Long, ByVal x As Long, ByVal y As Long, ByVal nWidth As Long, ByVal nHeight As Long, ByVal bRepaint As Long) As Long
Private Declare Function BringWindowToTop Lib "user32" (ByVal hwnd As Long) As Long
Private Declare Function SetFocus Lib "user32" (ByVal hwnd As Long) As Long
Private Declare Function showWindowI Lib "user32" Alias "ShowWindow" (ByVal lhWnd As Long, ByVal nCmdShow As Long) As Long
Private Declare Sub CopyMemory Lib "kernel32" Alias "RtlMoveMemory" (lpvDest As Any, lpvSource As Any, ByVal cbCopy As Long)
Private Declare Function SetForegroundWindow Lib "user32" (ByVal hwnd As Long) As Long

Private Type CopyData
    dwData As Long
    cbData As Long
    lpData As Long
End Type
'Initialize the class
Private Sub Class_Initialize()
    handle = 0
End Sub
'Get the process id
Private Sub loadProcId()
    ' Process id will be stored in idProc, the thread id is returned to threadId
    thread_id = GetWindowThreadProcessId(handle, proc_id)
End Sub
'Load a window by its title
Public Sub loadByTitle(title As String, Optional method As SearchMethod = TryAll)
    Dim try_result As Long

    If method = TryAll Then
        try_result = getWindowHandle(title, StartsWith)
        
        If Not try_result Then
            try_result = getWindowHandle(title, EndsWith)
        End If
        
        If Not try_result Then
            try_result = getWindowHandle(title, Contains)
        End If
    Else
        try_result = getWindowHandle(title, method)
    End If

    handle = try_result
    
    loadByHandle handle
End Sub
'Load by multiple titles
Public Sub loadByTitles(title1 As String, Optional title2 As String, Optional title3 As String)

    loadByTitle title1
    
    If Len(title2) And Not handle Then
        loadByTitle title2
    End If
    
    If Len(title3) And Not handle Then
        loadByTitle title3
    End If
End Sub
Public Function loadByHandle(handle_param As Long)
    Dim temp_title As String
    Dim temp_length As Integer

    handle = handle_param
    
    'Prepare a string where the text will go in
    temp_title = Space(256)
    
    'Get the title text (stored in titletmp)
    temp_length = GetWindowText(handle, temp_title, Len(temp_title))
    
    'Trim the result
    title = Left(temp_title, temp_length)
    
    If handle Then
        loadProcId
    End If
End Function
'Inject a DLL in this process
Public Sub injectDll(path As String)
    Injector.Inject_Dll path, CStr(proc_id)
End Sub
'Remove an injected DLL from this process
Public Sub removeDll(path As String)
    Injector.UnInject_Dll path, CStr(proc_id)
End Sub
'Send a message to this form
Public Sub sendMessage(message As String)
    Dim cds As CopyData
    Dim buf() As Byte
    ReDim buf(1 To LenB(message))
    Call CopyMemory(buf(1), ByVal message, Len(message))
    
    'Add data to the packet
    cds.dwData = 1
    cds.cbData = Len(message) * 2
    cds.lpData = VarPtr(buf(1))
    
    sendMessageI handle, WM_COPYDATA, 0, cds
End Sub
Public Sub sendJSON(payload)
    Dim message As String
    
    'Stringify the payload
    message = JSON.toString(payload)
    
    sendMessage (message)
End Sub
'Move this window
Public Sub moveWindow(x As Integer, y As Integer, width As Integer, height As Integer, Optional repaint As Long = 1)
    moveWindowI handle, x, y, width, height, repaint
End Sub
Public Sub showWindow()
    showWindowI handle, 5
End Sub
Public Function getChildWindow(title As String) As Window
    Dim child_handle As Long
    Dim Child As New Window

    'Look using this process id
    child_handle = windows.findwindowpartial(title, TryAll, proc_id)

    If Not child_handle Then
        Exit Function
    End If

    Child.loadByHandle child_handle
    getChildWindow = Child
End Function
Public Sub activate()
    'Set active window by the handle
    SetForegroundWindow handle
    
    'We could also use AppActivate, but that needs the title
    'So is less precise
    ''AppActivate title
End Sub
Public Sub typeKeys(keys As String, Optional wait As Boolean = True)
    'Activate the window
    activate
    
    'Send the keys and wait for it to return
    SendKeys keys, wait
End Sub


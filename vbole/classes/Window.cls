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
Private p_expected_process_name As String
Public expected_short_name As String

'Search options
Public search_for_dialog As Integer

Private p_parent_handle As Long
Private pLeft As Long
Private pRight As Long
Private pTop As Long
Private pBottom As Long
Private pWidth As Long
Private pHeight As Long

Private Declare Function GetWindowThreadProcessId Lib "user32" (ByVal hwnd As Long, lpdwProcessId As Long) As Long
Private Declare Function sendMessageI Lib "user32" Alias "SendMessageW" (ByVal hwnd As Long, ByVal wMsg As Long, ByVal wParam As Long, lParam As Any) As Long
Private Declare Function moveWindowI Lib "user32" Alias "MoveWindow" (ByVal hwnd As Long, ByVal X As Long, ByVal Y As Long, ByVal nWidth As Long, ByVal nHeight As Long, ByVal bRepaint As Long) As Long
Private Declare Function BringWindowToTop Lib "user32" (ByVal hwnd As Long) As Long
Private Declare Function SetFocus Lib "user32" (ByVal hwnd As Long) As Long
Private Declare Function showWindowI Lib "user32" Alias "ShowWindow" (ByVal lhWnd As Long, ByVal nCmdShow As Long) As Long
Private Declare Sub CopyMemory Lib "kernel32" Alias "RtlMoveMemory" (lpvDest As Any, lpvSource As Any, ByVal cbCopy As Long)
Private Declare Function SetForegroundWindow Lib "user32" (ByVal hwnd As Long) As Long
Private Declare Function SetActiveWindow Lib "user32" (ByVal hwnd As Long) As Long
Private Declare Function OpenProcess Lib "kernel32" (ByVal dwDesiredAccess As Long, ByVal bInheritHandle As Long, ByVal dwProcessId As Long) As Long
Private Declare Function EnumProcessModules Lib "psapi" (ByVal hProcess As Long, lphModule As Long, ByVal cb As Long, lpcbNeeded As Long) As Long
Private Declare Function GetModuleBaseName Lib "psapi" Alias "GetModuleBaseNameA" (ByVal hProcess As Long, ByVal hModule As Long, ByVal lpFileName As String, ByVal nSize As Long) As Long
Private Declare Function GetModuleFileNameEx Lib "psapi" Alias "GetModuleFileNameExA" (ByVal hProcess As Long, ByVal hModule As Long, ByVal lpFileName As String, ByVal nSize As Long) As Long
Private Declare Function CloseHandle Lib "kernel32" (ByVal hObject As Long) As Long

Private Const PROCESS_ALL_ACCESS = &H1F0FFF
Private Const WM_GETTEXT As Long = &HD
Private Const WM_GETTEXTLENGTH As Long = &HE

Private Type CopyData
    dwData As Long
    cbData As Long
    lpData As Long
End Type
'Initialize the class
Private Sub Class_Initialize()
    'Handle 0 means it is not found
    handle = 0
    
    '-1 means its not set
    p_parent_handle = -1
    
    '-1 means anything goes
    search_for_dialog = -1
End Sub
'Is this process still running?
Public Property Get is_running() As Boolean
    If loadProcId() = 0 Then
        is_running = False
    Else
        is_running = True
    End If
End Property
'Get the classname
Public Property Get class_name() As String
    class_name = windows.getClassName(handle)
End Property
'Expected process name getter
Public Property Get expected_process_name() As String
   expected_process_name = p_expected_process_name
End Property
'Set the expected process name
Public Property Let expected_process_name(ByVal name As String)
   p_expected_process_name = name
   expected_short_name = left(name, 6) & "~"
End Property
'Get the text content (of inputs)
Public Property Get text_content() As String
    Dim text_length As Long
    
    'Get the length of the text
    text_length = sendMessageI(Me.handle, WM_GETTEXTLENGTH, ByVal 0, ByVal 0)
    
    If text_length = 0 Then
        Exit Function
    End If
    
    text_content = String$(text_length, vbNullChar)
    sendMessageI Me.handle, WM_GETTEXT, ByVal (text_length + 1), ByVal StrPtr(text_content)
End Property
Public Function toJSON() As Dictionary
    Dim result As New Dictionary
    
    'Update the dimension info
    updateCoordinates
    
    result.Add "_type", "Window"
    result.Add "handle", Me.handle
    result.Add "parent", parent_handle
    result.Add "title", Me.title
    result.Add "class", Me.class_name
    result.Add "class_readable", WindowClasses.getReadableName(Me.class_name)
    result.Add "text_content", Me.text_content
    
    'Add the dimension info
    result.Add "left", pLeft
    result.Add "right", pRight
    result.Add "top", pTop
    result.Add "bottom", pBottom
    result.Add "width", pWidth
    result.Add "height", pHeight
    
    Set toJSON = result
End Function
'Load the process id
Public Function loadProcId() As Long
    ' Process id will be stored in idProc, the thread id is returned to threadId
    thread_id = GetWindowThreadProcessId(handle, proc_id)
    loadProcId = proc_id
End Function
'Load a window by its title
Public Sub loadByTitle(title As String, Optional method As SearchMethod = TryAll)
    Dim handles As Collection
    Dim test_handle As Long
    Dim test_class As String
    Dim test_window As Window
    Dim i As Integer
    Dim proc_name As String
    
    Set test_window = New Window
    
    'Look for all the handles that match this title
    Set handles = windows.findAllWindows(title, method)
    
    'Iterate over all the found handles
    For i = 1 To handles.Count
        test_handle = handles(i)
        test_class = windows.getClassName(test_handle)
        
        If Me.expected_process_name <> "" Then

            'Load the test Window instance with this handle
            test_window.loadByHandle test_handle
            
            'Get the (lowercase) process name
            proc_name = LCase(test_window.getProcessName())
            
            'If the process name does not match what we expect, skip it
            If proc_name <> Me.expected_process_name Then
                'Also check the shortname
                If InStr(proc_name, Me.expected_short_name) = 1 Then
                    'Don't skip, it's actually the expected process in shortname!
                Else
                    GoTo Continue
                End If
            End If
        End If
        
        'Allow either
        If search_for_dialog = -1 Then
            handle = test_handle
            Exit For
        'Allow non-dialogs
        ElseIf search_for_dialog = 0 Then
            If test_class <> "#32770" Then
                handle = test_handle
                Exit For
            End If
        'Allow only dialogs
        ElseIf search_for_dialog = 1 Then
            If test_class = "#32770" Then
                handle = test_handle
                Exit For
            End If
        End If

Continue:
    Next

    If handle <> 0 Then
        loadByHandle handle
    End If
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
    temp_length = GetWindowTextI(handle, temp_title, Len(temp_title))
    
    'Trim the result
    title = left(temp_title, temp_length)
    
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
Public Sub SendMessage(Message As String)
    Dim cds As CopyData
    Dim buf() As Byte
    ReDim buf(1 To LenB(Message))
    Call CopyMemory(buf(1), ByVal Message, Len(Message))
    
    'Add data to the packet
    cds.dwData = 1
    cds.cbData = Len(Message) * 2
    cds.lpData = VarPtr(buf(1))
    
    sendMessageI handle, WM_COPYDATA, 0, cds
End Sub
Public Sub sendJSON(payload)
    Dim Message As String
    
    'Stringify the payload
    Message = JSON.toString(payload)
    
    SendMessage (Message)
End Sub
'Move this window
Public Sub moveWindow(X As Long, Y As Long, width As Long, height As Long, Optional repaint As Long = 1)
    moveWindowI handle, X, Y, width, height, repaint
End Sub
Public Sub showWindow()
    showWindowI handle, 5
End Sub
'Get all child elements on this window
Public Function getAllChildElements(Optional ByVal recursive As Boolean = True) As Collection

    'If no handle is found, do nothing (or we'll search through ALL windows)
    If Me.handle = 0 Then
        Dim empty_result As New Collection
        Set getAllChildElements = empty_result
        Exit Function
    End If

    Set getAllChildElements = windows.getAllChildElementsOfWindow(handle, recursive)
End Function
'Get all the child windows of this one
Public Function getAllChildWindows()
    Dim result As New Collection
    Dim value As Variant
    Dim child As Window
    
    'If no handle is found, do nothing (or we'll search through ALL windows)
    If Me.handle = 0 Then
        Set getAllChildWindows = result
        Exit Function
    End If
    
    windows.findChildWindowHandles handle, result
    
    For Each value In result
        Debug.Print "Found child " & value
        Debug.Print " -- Class " & windows.getClassName(value)
        Debug.Print " -- Text " & windows.getWindowText(value)
        'Set Child = New Window
        'Child.loadByHandle CLng(Value)
        'Debug.Print " -- " & Child.title & " - " & Child.width
    Next value
End Function
'Get all child windows
Public Function getAllChildWindowsTwo(Optional title As String) As Collection
    Dim child_window As Window
    Dim all_windows As New Collection
    Dim all_handles As Collection
    Dim child_handle As Long
    Dim i As Integer
    
    'Get all the handles matching the title
    Set all_handles = windows.findAllWindows(title, TryAll)
    
    'Iterate through all the handles
    For i = 1 To all_handles.Count
        child_handle = all_handles(i)
        
        Debug.Print "Class of " & child_handle & " = " & windows.getClassName(child_handle)
        
        'Set child_window = New Window
        'child_window.loadByHandle all_handles(i)
        'all_windows.Append child_window
    Next
    
    Set getAllChildWindowsTwo = all_windows
End Function
'Get a window that has the current window as a parent handle
Public Function getChildWindow(title As String) As Window
    Dim child_handle As Long
    Dim child As New Window
    Dim all_handles As Collection
    Dim test_parent_handle As Long
    Dim test_handle As Long
    Dim i As Integer
    
    'If no handle is found, do nothing (or we'll search through ALL windows)
    If Me.handle = 0 Then
        Set getChildWindow = child
        Exit Function
    End If
    
    'Get all the handles matching the title
    Set all_handles = windows.findAllWindows(title, TryAll)

    'Iterate through all the handles
    For i = 1 To all_handles.Count
        test_handle = all_handles(i)
        test_parent_handle = windows.GetParent(test_handle)

        If test_parent_handle = handle Then
            child.loadByHandle test_handle
            child.parent_handle = test_parent_handle
            Exit For
        End If
    Next

    Set getChildWindow = child
End Function
Public Sub activate()

    If GetForegroundWindow() = handle Then
        'Activate the desktop window first.
        'We do this because clicking inside an application can mess up keyboard interaction,
        'and setting the foreground window afterwards won't work because it's already technically in the foreground
        'So we move focus off the window and then back again
        SetForegroundWindow GetDesktopWindow()
        
        'Sleep for 50ms
        Sleep 50
    End If

    'Set active window by the handle
    SetForegroundWindow handle
    
    'Sleep for at least 50ms
    Sleep 50
    
    'We could also use AppActivate, but that needs the title
    'So is less precise
    ''AppActivate title
End Sub
Public Sub typeKeys(keys As String, Optional wait As Boolean = True, Optional do_activate As Boolean = True)
    Dim WshShell As Object
    
    'Activate the window if wanted
    If do_activate Then
        activate
    End If
    
    'Create the wscript shell
    Set WshShell = CreateObject("wscript.shell")
    
    'Send the keys and wait for it to return
    WshShell.SendKeys keys, wait
    
    Set WshShell = Nothing
End Sub
'Get the path of the process
Public Function getProcessPath(Optional FullSpec As Boolean = True) As String
    Dim rtn As Long
    Dim lProcMods() As Long
    Dim sFileName As String * 260
    Dim lSize As Long
    Dim lRequired As Long
    Dim hProcess As Long
    Dim hWndOfFormWithFocus As Long
    Dim l As Long
    
    lSize = 4
    ReDim lProcMods(0)
    
    hProcess = OpenProcess(PROCESS_ALL_ACCESS, 0&, proc_id)
    ' Enumerate modules.
    rtn = EnumProcessModules(hProcess, lProcMods(0), lSize, lRequired)
    ' If array is not large enough to hold all results, number of bytes required is in lRequired.
    If lRequired > lSize Then
        lSize = lRequired
        ReDim lProcMods(0 To (lSize / 4) - 1)
        rtn = EnumProcessModules(hProcess, lProcMods(0), lSize, lRequired)
    End If
    ' lProcMods() now holds the list of module handles associated with the process.
    ' The zeroth element is the main program.
    If FullSpec Then
        rtn = GetModuleFileNameEx(hProcess, lProcMods(0), sFileName, Len(sFileName))
    Else
        rtn = GetModuleBaseName(hProcess, lProcMods(0), sFileName, Len(sFileName))
    End If

    getProcessPath = left$(sFileName, rtn)

    rtn = CloseHandle(hProcess)
End Function
'Get the name of the executable
Public Function getProcessName() As String
    Dim path As String
    Dim process_name As String
    
    'Get the full path
    path = Me.getProcessPath()

    'The process name is the part after the last backslash
    process_name = Mid$(path, InStrRev(path, "\", -1) + 1)
    
    'Set the process name as the return value
    getProcessName = process_name
End Function
Public Sub updateCoordinates()
    GetWindowSize handle, pLeft, pRight, pTop, pBottom, pWidth, pHeight
End Sub
'Window Left (X) getter
Public Property Get left() As Long
    updateCoordinates
    left = pLeft
End Property
'Window Left (X) setter
Public Property Let left(ByVal value As Long)
    updateCoordinates
    pLeft = value
    moveWindow pLeft, pTop, pWidth, pHeight
End Property
'Window Right getter
Public Property Get right() As Long
    updateCoordinates
    right = pRight
End Property
'Window Right setter
Public Property Let right(ByVal value As Long)
    updateCoordinates
    pRight = value
    pLeft = pRight - pWidth
    moveWindow pLeft, pTop, pWidth, pHeight
End Property
'Window Top (Y) getter
Public Property Get top() As Long
    updateCoordinates
    top = pTop
End Property
'Window Top (Y) setter
Public Property Let top(ByVal value As Long)
    updateCoordinates
    pTop = value
    moveWindow pLeft, pTop, pWidth, pHeight
End Property
'Window Bottom getter
Public Property Get bottom() As Long
    updateCoordinates
    bottom = pBottom
End Property
'Window Bottom setter
Public Property Let bottom(ByVal value As Long)
    updateCoordinates
    pBottom = value
    pTop = pBottom - pHeight
    moveWindow pLeft, pTop, pWidth, pHeight
End Property
'Window width getter
Public Property Get width() As Long
    updateCoordinates
    width = pWidth
End Property
'Window width setter
Public Property Let width(ByVal value As Long)
    updateCoordinates
    pWidth = value
    moveWindow pLeft, pTop, pWidth, pHeight
End Property
'Window height getter
Public Property Get height() As Long
    updateCoordinates
    height = pHeight
End Property
'Window height setter
Public Property Let height(ByVal value As Long)
    updateCoordinates
    pHeight = value
    moveWindow pLeft, pTop, pWidth, pHeight
End Property
'Parent handle getter
Public Property Get parent_handle() As Long
    If p_parent_handle = -1 Then
        p_parent_handle = windows.GetParent(handle)
    End If
    
    parent_handle = p_parent_handle
End Property
'Parent handle setter (does not change ownership)
Public Property Let parent_handle(ByVal value As Long)
    p_parent_handle = value
End Property
'Set the cursor to a position inside this window
Public Sub setCursor(X As Long, Y As Long)

    'Update the window coordinates
    updateCoordinates
    
    'Add the left & top of the window
    X = X + pLeft
    Y = Y + pTop
    
    'Activate the window
    activate
    
    Debug.Print "Setting cursor to " & X & "," & Y
    
    'Actually set the position
    Mouse.setPosition X, Y
End Sub
'Close the window
Public Sub closeWindow()
    windows.sendCloseMessage handle
End Sub

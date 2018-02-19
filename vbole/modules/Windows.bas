Attribute VB_Name = "Windows"
Public prog As String
Private Declare Function FindWindow Lib "user32.dll" Alias "FindWindowA" (ByVal lpClassName As Any, ByVal lpWindowName As Any) As Long
Private Declare Function GetWindow Lib "user32.dll" (ByVal hWnd As Long, ByVal wCmd As Long) As Long
Public Declare Function GetWindowTextI Lib "user32.dll" Alias "GetWindowTextA" (ByVal hWnd As Long, ByVal lpString As String, ByVal nMaxCount As Long) As Long
Private Declare Function GetWindowTextLength Lib "user32" Alias "GetWindowTextLengthA" (ByVal hWnd As Long) As Long
Public Declare Function GetParent Lib "user32.dll" (ByVal hWnd As Long) As Long
Private Declare Function GetWindowThreadProcessId Lib "user32" (ByVal hWnd As Long, lpdwprocessid As Long) As Long
Private Declare Function EnumWindows Lib "user32" (ByVal lpEnumFunc As Long, ByVal lParam As Long) As Long
Private Declare Function EnumChildWindows Lib "user32" (ByVal hwndParent As Long, ByVal lpEnumFunc As Long, ByVal lParam As Long) As Long
Private Declare Function GetWindowRect Lib "user32" (ByVal hWnd As Long, lpRect As WindowRect) As Long
Private Declare Function sendMessageI Lib "user32" Alias "SendMessageW" (ByVal hWnd As Long, ByVal wMsg As Long, ByVal wParam As Long, lParam As Any) As Long
Private Declare Function SendMessageA Lib "user32" (ByVal hWnd As Long, ByVal wMsg As Long, ByVal wParam As Long, lParam As Any) As Long
Public Declare Sub Sleep Lib "kernel32.dll" (ByVal dwMilliseconds As Long)
Public Declare Function GetDesktopWindow Lib "user32" () As Long
Public Declare Function GetForegroundWindow Lib "user32" () As Long

Public Declare Function findWindowEx Lib "user32.dll" Alias "FindWindowExA" (ByVal hwndParent As Long, Optional ByVal hwndChildAfter As Long, Optional ByVal lpszClass As String, Optional ByVal lpszWindow As String) As Long

Private Declare Function GetClassNameI Lib "user32" Alias "GetClassNameA" (ByVal hWnd As Long, _
                                                                          ByVal lpClassName As String, _
                                                                          ByVal nMaxCount As Long) _
                                                                          As Long
Declare Function GetDlgItem Lib "user32" (ByVal hDlg&, ByVal nIDDlgItem&) As Long

Public Const WM_COPYDATA = &H4A
Private Const gw_hwndnext = 2
Private Const FWP_STARTSWITH = 0
Private Const FWP_CONTAINS = 1
Private Const FWP_ENDSWITH = 2
Private title As String

Private Const WM_DESTROY As Long = &H2
Private Const WM_CLOSE As Long = &H10
Private Const WM_SYSCOMMAND = &H112
Private Const WM_COMMAND = &H111
Private Const WM_NCDESTROY = &H82
Private Const SC_CLOSE = &HF060
Private Const IDNO = 7

Public Enum SearchMethod
    StartsWith = 0
    Contains = 1
    EndsWith = 2
    TryAll = 3
End Enum

Private Type WindowRect
    left As Long
    top As Long
    right As Long
    bottom As Long
End Type

' The following variables are shared between the main ChildWindows procedure
' and the auxiliary (private) ChildWindows_CBK routine

' An array of Long holding the handle of all child windows.
Dim windowlist() As Long
' The number of elements in the array.
Dim windowsCount As Long
'Find all child windows of a parent handle
Public Sub findChildWindowHandles(parent_handle As Long, ByRef child_windows As Collection)

    Dim handle_tmp As Long
    
    'Start with the first window
    handle_tmp = FindWindow(0&, 0&)
    
    Do Until handle_tmp = 0
        If handle_tmp = 3146760 Then
            Debug.Print "Checking handle " & handle_tmp
        End If

        If GetParent(handle_tmp) = parent_handle Then
            child_windows.Add handle_tmp
            
            'Do it recursively
            findChildWindowHandles handle_tmp, child_windows
        End If
    
        handle_tmp = GetWindow(handle_tmp, gw_hwndnext)
    Loop

End Sub
'See if a certain value is already in a collection
Public Function containsValue(ByRef coll As Collection, ByVal val As Variant) As Boolean
    Dim i As Integer
    
    For i = 1 To coll.Count
        If coll(i) = val Then
            containsValue = True
            Exit Function
        End If
    Next
    
    'Default false value
    containsValue = False
End Function
'Get the text of a handle
Public Function getWindowText(ByVal handle As Long) As String
    Dim temp_title As String
    Dim temp_length As Long
    
    'Prepare a string where the text will go in
    temp_title = Space(256)
        
    'Get the title text (stored in titletmp)
    temp_length = GetWindowTextI(handle, temp_title, Len(temp_title))

    If temp_length Then
        'Remove the extra bits from the placeholder
        temp_title = left(temp_title, temp_length)
    End If

    getWindowText = Trim(temp_title)
End Function
'Improved version of finding window handles: this will return a collection of all matching windows
Public Function findAllWindows(ByVal title_part, Optional method As SearchMethod = TryAll) As Collection
    Dim result As New Collection
    Dim temp_results As Collection
    Dim temp_handle As Long
    Dim temp_length As Long
    Dim str_index As Long
    Dim end_index As Long
    Dim temp_title As String
    Dim temp_title_u As String
    Dim i As Integer
    Dim found As Boolean
    
    If method = TryAll Then
        Set temp_results = findAllWindows(title_part, StartsWith)
        
        For i = 1 To temp_results.Count
            temp_handle = temp_results(i)
            If Not containsValue(result, temp_handle) Then
                result.Add temp_handle
            End If
        Next
        
        Set temp_results = findAllWindows(title_part, Contains)
        
        For i = 1 To temp_results.Count
            temp_handle = temp_results(i)
            If Not containsValue(result, temp_handle) Then
                result.Add temp_handle
            End If
        Next
        
        Set temp_results = findAllWindows(title_part, EndsWith)
        
        For i = 1 To temp_results.Count
            temp_handle = temp_results(i)
            If Not containsValue(result, temp_handle) Then
                result.Add temp_handle
            End If
        Next
                
        Set findAllWindows = result
    
        Exit Function
    End If
    
    'Uppercase the part to look for
    title_part = UCase(title_part)
    
    'Get the starting handle
    temp_handle = FindWindow(0&, 0&)
    
    Do Until temp_handle = 0
        found = False
    
         'Prepare a string where the text will go in
        temp_title = Space(256)
        
        'Get the title text (stored in titletmp)
        temp_length = GetWindowTextI(temp_handle, temp_title, Len(temp_title))

        If temp_length Then
            'Remove the extra bits from the placeholder
            temp_title = left(temp_title, temp_length)

            'Uppercase the title
            temp_title_u = UCase(temp_title)
            
            'Look for the uppercase titlepart in the uppercase title
            str_index = InStr(temp_title_u, title_part)
            
            If method = SearchMethod.StartsWith Then
                If str_index = 1 Then
                    found = True
                End If
            End If
            
            If method = SearchMethod.Contains Then
                If str_index > 0 Then
                    found = True
                End If
            End If
            
            If method = SearchMethod.EndsWith Then
                'Calculate the index where the needle should start in this haystack
                end_index = (Len(temp_title_u) - Len(title_part)) + 1
                
                If str_index > 0 And str_index = end_index Then
                    found = True
                End If
            End If
            
            If found Then
                result.Add temp_handle
            End If
        End If
        
        'Get the next handle
        temp_handle = GetWindow(temp_handle, gw_hwndnext)
    Loop
    
    Set findAllWindows = result
End Function
'Find a window by the titlepart & search method
Public Function findwindowpartial(ByVal titlepart$, method As SearchMethod, Optional parent_proc As Long = 0, Optional parent_handle As Long = -1) As Long
    Dim hwndtmp As Long
    Dim nret As Long
    Dim titletmp As String
    Dim utitletmp As String
    Dim found As Boolean
    Dim str_index As Integer
    Dim end_index As Integer
    Dim title_len As Long
    Dim thread_id As Long
    Dim proc_id As Long
    
    If method = TryAll Then
        hwndtmp = findwindowpartial(titlepart, StartsWith, parent_proc)
        
        If Not hwndtmp Then
            hwndtmp = findwindowpartial(titlepart, Contains, parent_proc)
        End If
        
        If Not hwndtmp Then
            hwndtmp = findwindowpartial(titlepart, EndsWith, parent_proc)
        End If
        
        findwindowpartial = hwndtmp
    
        Exit Function
    End If

    titlepart = UCase(titlepart)
    hwndtmp = FindWindow(0&, 0&)
    Do Until hwndtmp = 0
        'Reset the found value
        found = False

        If parent_handle = -1 Or GetParent(hwndtmp) = parent_handle Then
        
            'Prepare a string where the text will go in
            titletmp = Space(256)
            
            'Get the title text (stored in titletmp)
            'nret is the length
            nret = GetWindowTextI(hwndtmp, titletmp, Len(titletmp))
            
            If nret Then
                'Remove the extra bits from the placeholder
                titletmp = left(titletmp, nret)

                'Uppercase the title
                utitletmp = UCase(titletmp)
                
                'Look for the uppercase titlepart in the uppercase title
                str_index = InStr(utitletmp, titlepart)
                
                If method = SearchMethod.StartsWith Then
                    If str_index = 1 Then
                        found = True
                    End If
                End If
                
                If method = SearchMethod.Contains Then
                    If str_index > 0 Then
                        found = True
                    End If
                End If
                
                If method = SearchMethod.EndsWith Then
                    'Calculate the index where the needle should start in this haystack
                    end_index = (Len(utitletmp) - Len(titlepart)) + 1
                    
                    If str_index > 0 And str_index = end_index Then
                        found = True
                    End If
                End If

                If found Then
                
                    If parent_proc Then
                        thread_id = GetWindowThreadProcessId(hwndtmp, proc_id)
                        
                        If proc_id <> parent_proc Then
                            Debug.Print "Continuing... '" & titletmp & "' " & hwndtmp & " because proc " & proc_id & " and thread " & thread_id & " does not eq " & parent_proc
                            GoTo ContinueLoop
                        End If
                    End If
                
                    findwindowpartial = hwndtmp
                    Exit Do
                End If
            End If
        End If
        
ContinueLoop:
        hwndtmp = GetWindow(hwndtmp, gw_hwndnext)
    Loop
    title = titletmp
End Function
Private Function appactivatepartial(titlecontains$, method As SearchMethod, ByRef results) As Long
    Dim hwndapp As Long
    Dim nret As Long
    
    'Debug.Print "Going to look for '" & titlecontains & "'"

    hwndapp = findwindowpartial(titlecontains, method)
    If hwndapp Then
        appactivatepartial = hwndapp
        
        'For debug purposes
        'Debug.Print " -- Found in '" & title & "'"
        
        results.Add (title)
    End If
End Function
Public Function getWindowProcId(title As String, Optional method As SearchMethod = 0) As Long
    Dim procId As Long
    Dim threadId As Long
    Dim handle As Long
    
    handle = getWindowHandle(title, method)
    
    Debug.Print "Handle is " & handle

    ' Process id will be stored in idProc, the thread id is returned to threadId
    threadId = GetWindowThreadProcessId(handle, procId)
    
    getWindowProcId = procId
End Function
Public Function getWindowHandle(title As String, Optional method As SearchMethod = 0) As Long
    Dim results As Collection
    Set results = New Collection
    
    getWindowHandle = appactivatepartial(title, method, results)
    
End Function
Public Function getAll() As Collection
    Dim prog As String
    Dim results As Collection
    Set results = New Collection

    For i = 65 To 90
        prog = Chr(i)
        appactivatepartial prog, StartsWith, results
    Next
    
    Set getAll = results
End Function
Public Function activateWindow(title, Optional wait As Integer = 60) As Boolean
    Dim windows As Collection

    Set windows = getAll()
    activateWindow = False
    
    On Error Resume Next
    
    For Each value In windows
        If InStr(value, title) Then
            AppActivate value
            activateWindow = True
            Exit For
        End If
    Next value
End Function
' Return an array of Long holding the handles of all the child windows
' of a given window. If hWnd = 0 it returns all the top-level windows.
Function ChildWindows(ByVal hWnd As Long) As Long()
    windowsCount = 0
    If hWnd Then
        EnumChildWindows hWnd, AddressOf EnumWindows_CBK, 1
    Else
        EnumWindows AddressOf EnumWindows_CBK, 1
    End If
    ' Trim uninitialized elements and return to caller.
    ReDim Preserve windowlist(windowsCount) As Long
    ChildWindows = windowlist()
End Function
' The callback routine, common to both EnumWindows and EnumChildWindows.
Private Function EnumWindows_CBK(ByVal hWnd As Long, ByVal lParam As Long) As _
    Long
    ' Make room in the array, if necessary.
    If windowsCount = 0 Then
        ReDim windowlist(100) As Long
    ElseIf windowsCount >= UBound(windowlist) Then
        ReDim Preserve windowlist(windowsCount + 100) As Long
    End If
    
    ' Store the new item.
    windowsCount = windowsCount + 1
    windowlist(windowsCount) = hWnd
    ' Return 1 to continue enumeration.
    EnumWindows_CBK = 1
End Function
'Get a window's size in pixel
Public Sub GetWindowSize(ByVal hWnd As Long, Optional ByRef left As Long, Optional ByRef right As Long, Optional ByRef top As Long, Optional ByRef bottom As Long, Optional ByRef width As Long, Optional ByRef height As Long)
    Dim rc As WindowRect

    GetWindowRect hWnd, rc
    
    left = rc.left
    right = rc.right
    top = rc.top
    bottom = rc.bottom
    width = rc.right - rc.left
    height = rc.bottom - rc.top
End Sub
'Get the class name of the window
Public Function getClassName(ByVal handle As Long) As String
    Dim class_name As String
    Dim str_length As Long
    
    'Make temporary string
    class_name = Space(256)
    
    'Get the classname and the length
    str_length = GetClassNameI(handle, class_name, Len(class_name))
    
    'Trim the string
    class_name = left(class_name, str_length)
    
    getClassName = class_name
End Function
'Send a close message to the window
Public Sub sendCloseMessage(ByVal handle As Long)

    If GetDlgItem(handle, IDNO) Then
        Call SendMessageA(handle, WM_COMMAND, IDNO, ByVal 0&)
    Else
        Call SendMessageA(handle, WM_CLOSE, 0, ByVal 0&)
    End If
End Sub
'Get all child elements of the given handle
Public Function getAllChildElementsOfWindow(ByVal handle As Long, Optional recursive As Boolean = True) As Collection
    Dim result As New Collection
    Dim child_window As Window
    Dim temp_col As Collection
    Dim found_handle As Long
    Dim i As Integer
    
    'Set the starting handle to zero
    found_handle = 0
    
    'Get the first child
    'child_handle = windows.findWindowEx(handle)
    
    Do

        'Get the next handle
        found_handle = windows.findWindowEx(handle, found_handle)
        
        If found_handle = 0 Then
            Exit Do
        End If
        
        'Create a new instance of the window class (even for labels and such)
        Set child_window = New Window
        child_window.loadByHandle found_handle
        
        Debug.Print " Child text: " & child_window.title
        Debug.Print " -- Class:" & child_window.class_name
        
        'Add it to the result
        result.Add child_window
        
        'If we should look recursive, do so now
        If recursive Then
            Set temp_col = getAllChildElementsOfWindow(found_handle, True)
            
            For i = 1 To temp_col.Count
                result.Add temp_col(i)
            Next
        End If
    
    Loop Until found_handle = 0
    
    Set getAllChildElementsOfWindow = result
End Function

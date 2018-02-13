Attribute VB_Name = "Windows"
Public prog As String
Private Declare Function FindWindow Lib "user32.dll" Alias "FindWindowA" (ByVal lpClassName As Any, ByVal lpWindowName As Any) As Long
Private Declare Function GetWindow Lib "user32.dll" (ByVal hWnd As Long, ByVal wCmd As Long) As Long
Public Declare Function GetWindowText Lib "user32.dll" Alias "GetWindowTextA" (ByVal hWnd As Long, ByVal lpString As String, ByVal nMaxCount As Long) As Long
Private Declare Function GetWindowTextLength Lib "user32" Alias "GetWindowTextLengthA" (ByVal hWnd As Long) As Long
Private Declare Function GetParent Lib "user32.dll" (ByVal hWnd As Long) As Long
Private Declare Function GetWindowThreadProcessId Lib "user32" (ByVal hWnd As Long, lpdwprocessid As Long) As Long
Private Declare Function EnumWindows Lib "user32" (ByVal lpEnumFunc As Long, _
    ByVal lParam As Long) As Long
Private Declare Function EnumChildWindows Lib "user32" (ByVal hWndParent As _
    Long, ByVal lpEnumFunc As Long, ByVal lParam As Long) As Long

Private Declare Function GetWindowRect Lib "user32" (ByVal hWnd As Long, lpRect As WindowRect) As Long

Public Const WM_COPYDATA = &H4A
Private Const gw_hwndnext = 2
Private Const FWP_STARTSWITH = 0
Private Const FWP_CONTAINS = 1
Private Const FWP_ENDSWITH = 2
Private title As String
Public Enum SearchMethod
    StartsWith = 0
    Contains = 1
    EndsWith = 2
    TryAll = 3
End Enum

Private Type WindowRect
    Left As Long
    Top As Long
    Right As Long
    Bottom As Long
End Type
' The following variables are shared between the main ChildWindows procedure
' and the auxiliary (private) ChildWindows_CBK routine

' An array of Long holding the handle of all child windows.
Dim windowlist() As Long
' The number of elements in the array.
Dim windowsCount As Long
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
            nret = GetWindowText(hwndtmp, titletmp, Len(titletmp))
            
            If nret Then
                'Remove the extra bits from the placeholder
                titletmp = Left(titletmp, nret)

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
    
    For Each Value In windows
        If InStr(Value, title) Then
            AppActivate Value
            activateWindow = True
            Exit For
        End If
    Next Value
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
Public Sub GetWindowSize(ByVal hWnd As Long, Optional ByRef Left As Long, Optional ByRef Right As Long, Optional ByRef Top As Long, Optional ByRef Bottom As Long, Optional ByRef Width As Long, Optional ByRef Height As Long)
    Dim rc As WindowRect

    GetWindowRect hWnd, rc
    
    Left = rc.Left
    Right = rc.Right
    Top = rc.Top
    Bottom = rc.Bottom
    Width = rc.Right - rc.Left
    Height = rc.Bottom - rc.Top
End Sub

Attribute VB_Name = "CAOSole"
Option Explicit
Dim ddeb As Boolean

'C2 OLE App goes here
Dim App As Object

'C2 Window goes here
Dim C2Window As Window

'C2 Speedhack window
Dim C2Speed As Window

'Current active window goes here
Dim ActiveWindow As Window

'The current path
Dim current_path As String

'External functions
Private Declare Function GetStdHandle Lib "kernel32" (ByVal nStdHandle As Long) As Long
Private Declare Function ReadFile Lib "kernel32" (ByVal hFile As Long, lpBuffer As Any, ByVal nNumberOfBytesToRead As Long, lpNumberOfBytesRead As Long, lpOverlapped As Any) As Long
Private Declare Function WriteFile Lib "kernel32" (ByVal hFile As Long, lpBuffer As Any, ByVal nNumberOfBytesToWrite As Long, lpNumberOfBytesWritten As Long, lpOverlapped As Any) As Long

'Constants
Private Const STD_ERROR_HANDLE As Long = -12&
Private Const STD_OUTPUT_HANDLE = -11&
Private Const STD_INPUT_HANDLE = -10&
Private Const STATUS_SUCCESS = 0
'The entry function
Public Sub Main()
On Error GoTo ERR_HANDLER

    Dim in_string As String
    Dim out_string As String
    Dim response As String
    Dim req As Object
    
    'Create the internal Window class instances
    Set C2Window = New Window
    Set C2Speed = New Window
    
    'Get the C2 window
    C2Window.loadByTitles ".sfc - Creatures 2", "- Creatures 2", "Creatures 2"

ListenLoop:
    Do
        'Get the string input
        in_string = ReadStdIn()
        
        'Parse the JSON payload
        Set req = JSON.parse(in_string)
        
        'Create the OLE connection to C2
        '(will start C2 if it isn't running yet)
        If App Is Nothing Then
            Set App = CreateObject("SFC2.OLE")
        End If
        
        'If C2 is no longer running, start it again
        If C2Window.is_running = False Then
            'Load C2 again
            Set App = CreateObject("SFC2.OLE")
            
            'Sleep for 1 second
            windows.Sleep 1000
            
            'Load the window again
            Set C2Window = New Window
            C2Window.loadByTitles ".sfc - Creatures 2", "- Creatures 2", "Creatures 2"
            
            'Unset the speedhack window
            Set C2Speed = New Window
        End If
        
        
        'Is this 1 command or multiple?
        If TypeName(req) = "Collection" Then
            response = executeCommands(req)
        Else
            response = executeCommand(req)
        End If
                
        'Output the response
        WriteStdOut response & vbCrLf
    Loop
    
    Exit Sub

ERR_HANDLER:
WriteStdErr Err.Source & " caused an error of type " & Err.Number & " - " & Err.Description & vbCrLf
GoTo ListenLoop
    
byebye:
End Sub
'Execute multiple request after another
Function executeCommands(commands As Collection) As String
    Dim response As New Collection
    Dim req As Object
    
    For Each req In commands
        response.Add executeCommand(req)
    Next
    
    'Convert all the responses to a json string
    executeCommands = JSON.toString(response)
End Function
'Execute a single request
Function executeCommand(req As Object) As String
    Dim response As String
    Dim cmd_type As String
    response = ""
    cmd_type = req.Item("type")

    If cmd_type = "caos" Then
        'Send the command to C2
        App.firecommand 1, req.Item("command"), response

    ElseIf cmd_type = "c2window" Then
        'Set the ActiveWindow to C2Window
        Set ActiveWindow = C2Window
        response = CStr(C2Window.handle)

    ElseIf cmd_type = "window" Then
        'Load a window by title as the active window
        Set ActiveWindow = New Window
        ActiveWindow.loadByTitle req.Item("command")
        response = CStr(ActiveWindow.handle)

    ElseIf cmd_type = "keys" Then
        'Send keystrokes to the current active window
        ActiveWindow.typeKeys req.Item("command")

    ElseIf cmd_type = "message" Then
        'Send a message to the current active window
        ActiveWindow.sendMessage req.Item("command")

    ElseIf cmd_type = "setspeed" Then
        'Set the speed of C2
        setSpeed req.Item("acceleration"), req.Item("sleeptime")
    
    ElseIf cmd_type = "activatewindow" Then
        'Activate the current window
        ActiveWindow.activate

    ElseIf cmd_type = "movewindow" Then
        'Move the current active window
        ActiveWindow.moveWindow req.Item("x"), req.Item("y"), req.Item("width"), req.Item("height"), req.Item("repaint")
    
    ElseIf cmd_type = "setcursor" Then
        'Move the cursor
        ActiveWindow.setCursor req.Item("x"), req.Item("y")
    
    ElseIf cmd_type = "click" Then
        'Click down
        Mouse.LeftClick

    ElseIf cmd_type = "getpath" Then
        'Get the current set path
        response = current_path

    ElseIf cmd_type = "setpath" Then
        'Set the current path
        current_path = req.Item("command")
    
    ElseIf cmd_type = "getprocesspath" Then
        'Get the path of the process of the active window
        response = ActiveWindow.getProcessPath(True)
    
    End If
    
    executeCommand = response
End Function
Function setSpeed(acceleration As Double, Optional sleeptime As Integer = 5) As Boolean
    Dim msgObject As Dictionary
    Set msgObject = New Dictionary
    
    If C2Speed.handle = 0 Then
        Debug.Print "Going to look for Speedhack window"

        'Try getting the window
        C2Speed.loadByTitle "Skerit's C2 Speedhack"
        
        If C2Speed.handle = 0 Then
            Debug.Print "Speedhack window not yet found, injecting DLL into '" & C2Window.title & "'"

            'Inject the DLL (current_path is actually set from within node)
            C2Window.injectDll current_path & "\speedhack.dll"
            
            'Sleep for half a second
            windows.Sleep 500

            'Try loading the window again
            C2Speed.loadByTitle "Skerit's C2 Speedhack"
            
            If C2Speed.handle = 0 Then
                Debug.Print "Still no speedhack window found, error!"
                setSpeed = False
                Exit Function
            Else
                Debug.Print "Found speedhack window!"
                C2Speed.moveWindow -200, 10, C2Speed.width, C2Speed.height
            End If
        Else
            Debug.Print "Speedhack window found, handle = " & C2Speed.handle & " - " & C2Speed.title
        End If
    End If
    
    If C2Speed.left > 0 Then
        'Move the window off screen
        C2Speed.moveWindow -200, 10, C2Speed.width, C2Speed.height
    End If
    
    Debug.Print "Setting C2 speed to " & acceleration
    
    msgObject.Add "type", "setspeed"
    msgObject.Add "acceleration", acceleration
    msgObject.Add "sleeptime", sleeptime
    C2Speed.sendJSON msgObject
    
    setSpeed = True
End Function
'Export a creature
Function exportCreature(creature_id As String, filepath As String) As Boolean
    Dim filen As String
    Dim dumm As String
    Dim newidx As Integer
    Dim export_window As New Window
    Dim command_response As String

    'Target the creature
    App.firecommand 1, "inst,setv norn " & creature_id & ",endm", command_response
    
    'Send Alt-F to open the File menu
    C2Window.typeKeys "%F"
    
    'Send "E" to open the Export
    C2Window.typeKeys "E"
    
    export_window.loadByTitle "Export Current Creature"
    
    'If the Export window was not found, return
    If export_window.handle = 0 Then
        Debug.Print "Export window not found"
        exportCreature = False
        Exit Function
    End If
    
    'Set the filepath
    export_window.typeKeys filepath
    
    'And press enter
    export_window.typeKeys "{enter}"
    
    exportCreature = True
End Function
'Read the standard input
Function ReadStdIn(Optional ByVal NumBytes As Long = -1) As String
    Dim StdIn As Long
    Dim result As Long
    Dim Buffer As String
    Dim BytesRead As Long
    StdIn = GetStdHandle(STD_INPUT_HANDLE)
    Buffer = Space$(1024)
    Do
        result = ReadFile(StdIn, ByVal Buffer, Len(Buffer), BytesRead, ByVal 0&)
        If result = 0 Then
            Err.Raise 1001, , "Unable to read from standard input"
        End If
        ReadStdIn = ReadStdIn & left$(Buffer, BytesRead)
    Loop Until BytesRead < Len(Buffer)
End Function
'Write to the standard output
Sub WriteStdOut(ByVal Text As String)
    Dim StdOut As Long
    Dim result As Long
    Dim BytesWritten As Long
    StdOut = GetStdHandle(STD_OUTPUT_HANDLE)
    result = WriteFile(StdOut, ByVal Text, Len(Text), BytesWritten, ByVal 0&)
    If result = 0 Then
        Err.Raise 1001, , "Unable to write to standard output"
    ElseIf BytesWritten < Len(Text) Then
        Err.Raise 1002, , "Incomplete write operation"
    End If
End Sub
'Write to the error output
Sub WriteStdErr(ByVal Text As String)
    Dim StdErr As Long
    Dim result As Long
    Dim BytesWritten As Long
    
    Debug.Print "Writing to STDERR: " & Text
    
    StdErr = GetStdHandle(STD_ERROR_HANDLE)
    result = WriteFile(StdErr, ByVal Text, Len(Text), BytesWritten, ByVal 0&)
    
    If result = 0 Then
        Err.Raise 1001, , "Unable to write to error output"
    ElseIf BytesWritten < Len(Text) Then
        Err.Raise 1002, , "Incomplete write operation"
    End If
End Sub

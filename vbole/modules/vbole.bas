Attribute VB_Name = "CAOSole"
Option Explicit
Dim ddeb As Boolean

'C2 OLE App goes here
Dim App As Object

'C2 Window goes here
Dim C2Window As Window

'C2 Speedhack window
Dim C2Speed As Window

'C2 Error dialog box
Dim C2Error As Window

'Current active window goes here
Dim ActiveWindow As Window

'The current path
Dim current_path As String

'Window classes
Public WindowClasses As New WindowClass

'External functions
Private Declare Function GetStdHandle Lib "kernel32" (ByVal nStdHandle As Long) As Long
Private Declare Function ReadFile Lib "kernel32" (ByVal hFile As Long, lpBuffer As Any, ByVal nNumberOfBytesToRead As Long, lpNumberOfBytesRead As Long, lpOverlapped As Any) As Long
Private Declare Function WriteFile Lib "kernel32" (ByVal hFile As Long, lpBuffer As Any, ByVal nNumberOfBytesToWrite As Long, lpNumberOfBytesWritten As Long, lpOverlapped As Any) As Long
Private Declare Function FlushFileBuffers Lib "kernel32" (ByVal hFile As Long) As Long

'Constants
Private Const STD_ERROR_HANDLE As Long = -12&
Private Const STD_OUTPUT_HANDLE = -11&
Private Const STD_INPUT_HANDLE = -10&
Private Const STATUS_SUCCESS = 0
'The entry function
Public Sub Main()
On Error GoTo ERR_HANDLER

    Dim test_window As Window
    Dim test_long As Long
    Dim test_coll As Collection

    Dim in_string As String
    Dim out_string As String
    Dim response As String
    Dim res_req As Dictionary
    Dim req As Object
    Dim error_res As Dictionary
    Dim error_reply As Dictionary
    
    'Create the internal Window class instances
    Set C2Window = New Window
    Set C2Speed = New Window

    'The C2Window should not be a dialog box
    C2Window.search_for_dialog = 0
    
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
        
        'See if any error dialogs have popped up
        Call gotErrorDialog
        
        'Is this 1 command or multiple?
        If TypeName(req) = "Collection" Then
            response = executeCommands(req)
        Else
            Set res_req = executeCommand(req)
            response = JSON.toString(res_req)
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
'See if any dialog boxes pop up and handle them!
Public Function gotErrorDialog() As Boolean
    Dim error_res As Dictionary
    Dim error_reply As Dictionary
    
    'Default result value is false
    gotErrorDialog = False
    
    Call WriteDebug("Going to look for Error Dialogs")
    
    'See if there is an error dialog open
    Set C2Error = C2Window.getChildWindow("Creatures 2")
    
    'Error window found!
    Do While C2Error.handle <> 0
        'Yup, there was an error!
        gotErrorDialog = True

        Set error_res = New Dictionary
        error_res.Add "error", "DialogBox"
        error_res.Add "elements", C2Error.getAllChildElements(True)
        
        Call WriteDebug("Found Error Dialog, going to wait for response")
        
        'Write to the error output
        WriteStdErr JSON.toString(error_res)
        
        'Wait for the error reply!
        Set error_reply = JSON.parse(ReadStdIn())
        
        'For now we only listen for the "close" command
        If error_reply.Item("type") = "close" Then
            C2Error.closeWindow
            Sleep 200
        End If
        
        'Debug code...
        'WriteStdErr JSON.toString(error_reply) & vbCrLf
    
        'See if a new error window popped up
        Set C2Error = C2Window.getChildWindow("Creatures 2")
    Loop
End Function
'Execute multiple request after another
Function executeCommands(commands As Collection) As String
    Dim response As New Collection
    Dim req_res As Dictionary
    Dim req As Object
    
    For Each req In commands
        'Execute the command and get the response dictionary
        Set req_res = executeCommand(req)
        
        'Add the response dictionary to the response collection
        response.Add req_res
        
        'If this command caused an error, end loop
        If req_res.Exists("error") Then
            Exit For
        End If
    Next
    
    'Convert all the responses to a json string
    executeCommands = JSON.toString(response)
End Function
'Execute a single request
Function executeCommand(req As Object) As Dictionary
    Dim response As New Dictionary
    Dim str_result As String
    Dim cmd_type As String
    cmd_type = req.Item("type")
    
    WriteDebug "Executing command " & cmd_type

    If cmd_type = "caos" Then
        'Send the command to C2
        App.firecommand 1, req.Item("command"), str_result
        
        'Add the result to the respone
        response.Add "result", str_result

    ElseIf cmd_type = "c2window" Then
        'Set the ActiveWindow to C2Window
        Set ActiveWindow = C2Window
        
        If C2Window.handle = 0 Then
            response.Add "error", "C2Window not found!"
        Else
            response.Add "handle", C2Window.handle
        End If

    ElseIf cmd_type = "window" Then
        'Load a window by title as the active window
        Set ActiveWindow = New Window
        ActiveWindow.loadByTitle req.Item("command")
        
        If ActiveWindow.handle = 0 Then
            response.Add "error", "Window '" & req.Item("command") & "' not found"
        Else
            response.Add "handle", ActiveWindow.handle
        End If
    
    ElseIf cmd_type = "close" Then
        'Close the window
        If ActiveWindow.handle = 0 Then
            response.Add "error", "Window '" & req.Item("command") & "' not found"
        Else
            ActiveWindow.closeWindow
        End If

    ElseIf cmd_type = "keys" Then
    
        If ActiveWindow.handle = 0 Then
            response.Add "error", "No window is active"
        Else
            'Send keystrokes to the current active window
            ActiveWindow.typeKeys req.Item("command")
        End If

    ElseIf cmd_type = "message" Then
        If ActiveWindow.handle = 0 Then
            response.Add "error", "No window is active"
        Else
            'Send a message to the current active window
            ActiveWindow.SendMessage req.Item("command")
        End If

    ElseIf cmd_type = "setspeed" Then
        'Set the speed of C2
        setSpeed req.Item("acceleration"), req.Item("sleeptime")
    
    ElseIf cmd_type = "activatewindow" Then
        If ActiveWindow.handle = 0 Then
            response.Add "error", "No window is active"
        Else
            'Activate the current window
            ActiveWindow.activate
        End If

    ElseIf cmd_type = "movewindow" Then
        If ActiveWindow.handle = 0 Then
            response.Add "error", "No window is active"
        Else
            'Move the current active window
            ActiveWindow.moveWindow req.Item("x"), req.Item("y"), req.Item("width"), req.Item("height"), req.Item("repaint")
        End If
    
    ElseIf cmd_type = "setcursor" Then
        If ActiveWindow.handle = 0 Then
            response.Add "error", "No window is active"
        Else
            'Move the cursor
            ActiveWindow.setCursor req.Item("x"), req.Item("y")
        End If
    
    ElseIf cmd_type = "click" Then
        'Click down
        Mouse.LeftClick

    ElseIf cmd_type = "getpath" Then
        'Get the current set path
        response.Add "current_path", current_path

    ElseIf cmd_type = "setpath" Then
        'Set the current path
        current_path = req.Item("command")
    
    ElseIf cmd_type = "getprocesspath" Then
        'Get the path of the process of the active window
        response.Add "process_path", ActiveWindow.getProcessPath(True)
    
    ElseIf cmd_type = "sleep" Then
        'Sleep for the given amount of ms
        Sleep req.Item("command")
    
    End If
    
    WriteDebug "Finished command " & cmd_type
    
    'Did a dialog box pop up during this command?
    'Then we have to add an error
    If gotErrorDialog() And Not response.Exists("error") Then
        WriteDebug "Adding error to command response of " & cmd_type & " because a dialog appeared"
        response.Add "error", "A dialog box popped up"
    End If
    
    Set executeCommand = response
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
    Else
        FlushFileBuffers StdOut
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
    Else
        FlushFileBuffers StdErr
    End If
End Sub
'Write a debug to the error output
Sub WriteDebug(ByVal Text As String)
    On Error GoTo fallback
    
    'Write the debug message to StdErr
    WriteStdErr "[DEBUG] " & Text & vbCrLf
    
    Exit Sub
fallback:
    Debug.Print Text
End Sub

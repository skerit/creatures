Attribute VB_Name = "CAOSole"
Option Explicit

Private Declare Function GetStdHandle Lib "kernel32" (ByVal nStdHandle As Long) As Long
Private Declare Function ReadFile Lib "kernel32" (ByVal hFile As Long, _
    lpBuffer As Any, ByVal nNumberOfBytesToRead As Long, _
    lpNumberOfBytesRead As Long, lpOverlapped As Any) As Long
Private Declare Function WriteFile Lib "kernel32" (ByVal hFile As Long, _
    lpBuffer As Any, ByVal nNumberOfBytesToWrite As Long, _
    lpNumberOfBytesWritten As Long, lpOverlapped As Any) As Long

Private Const STD_OUTPUT_HANDLE = -11&
Private Const STD_INPUT_HANDLE = -10&
Public Sub Main()
    Dim in_string As String
    Dim out_string As String
    Dim response As String
    Dim App As Object
    
    'Create a connection to the Creatures 2 application
    Set App = CreateObject("SFC2.OLE")

    Do
        'Get the string input
        in_string = ReadStdIn()
        
        'Send the command to C2
        App.firecommand 1, in_string, response
        
        'Output the response
        WriteStdOut response & vbCrLf
    Loop
End Sub
Function ReadStdIn(Optional ByVal NumBytes As Long = -1) As String
    Dim StdIn As Long
    Dim Result As Long
    Dim Buffer As String
    Dim BytesRead As Long
    StdIn = GetStdHandle(STD_INPUT_HANDLE)
    Buffer = Space$(1024)
    Do
        Result = ReadFile(StdIn, ByVal Buffer, Len(Buffer), BytesRead, ByVal 0&)
        If Result = 0 Then
            Err.Raise 1001, , "Unable to read from standard input"
        End If
        ReadStdIn = ReadStdIn & Left$(Buffer, BytesRead)
    Loop Until BytesRead < Len(Buffer)
End Function

Sub WriteStdOut(ByVal Text As String)
    Dim StdOut As Long
    Dim Result As Long
    Dim BytesWritten As Long
    StdOut = GetStdHandle(STD_OUTPUT_HANDLE)
    Result = WriteFile(StdOut, ByVal Text, Len(Text), BytesWritten, ByVal 0&)
    If Result = 0 Then
        Err.Raise 1001, , "Unable to write to standard output"
    ElseIf BytesWritten < Len(Text) Then
        Err.Raise 1002, , "Incomplete write operation"
    End If
End Sub

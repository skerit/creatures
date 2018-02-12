Attribute VB_Name = "Injector"
Option Explicit
Private Type MODULEENTRY32
    dwSize As Long
    th32ModuleID As Long
    th32ProcessID As Long
    GlblcntUsage As Long
    ProccntUsage As Long
    modBaseAddr As Long
    modBaseSize As Long
    hModule As Long
    szModule As String * 256
    szExePath As String * 260
End Type
 
Private Const TH32CS_SNAPMODULE As Long = &H8
Private Const PAGE_READWRITE As Long = &H4
Private Const MEM_RELEASE As Long = &H8000
Private Const MEM_COMMIT As Long = &H1000
Private Const STANDARD_RIGHTS_REQUIRED As Long = &HF0000
Private Const SYNCHRONIZE As Long = &H100000
Private Const PROCESS_ALL_ACCESS As Long = (STANDARD_RIGHTS_REQUIRED Or SYNCHRONIZE Or &HFFF)
Private Const INFINITE As Long = &HFFFFFF

Private Declare Function VirtualAllocEx Lib "kernel32" (ByVal hProcess As Long, ByVal lpAddress As Long, ByVal dwSize As Long, ByVal flAllocationType As Long, ByVal flProtect As Long) As Long
Private Declare Function VirtualFreeEx Lib "kernel32" (ByVal hProcess As Long, lpAddress As Any, ByVal dwSize As Long, ByVal dwFreeType As Long) As Long
Private Declare Function CreateRemoteThread Lib "kernel32" (ByVal hProcess As Long, lpThreadAttributes As Any, ByVal dwStackSize As Long, lpStartAddress As Long, lpParameter As Any, ByVal dwCreationFlags As Long, lpThreadId As Long) As Long
Private Declare Function OpenProcess Lib "kernel32" (ByVal dwDesiredAccess As Long, ByVal bInheritHandle As Long, ByVal dwProcessId As Long) As Long
Private Declare Function WriteProcessMemory Lib "kernel32" (ByVal hProcess As Long, lpBaseAddress As Any, lpBuffer As Any, ByVal nSize As Long, lpNumberOfBytesWritten As Long) As Long
Private Declare Function GetModuleHandle Lib "kernel32" Alias "GetModuleHandleA" (ByVal lpModuleName As String) As Long
Private Declare Function GetProcAddress Lib "kernel32" (ByVal hModule As Long, ByVal lpProcName As String) As Long
Private Declare Function WaitForSingleObject Lib "kernel32" (ByVal hHandle As Long, ByVal dwMilliseconds As Long) As Long
Private Declare Function CloseHandle Lib "kernel32" (ByVal hObject As Long) As Long
Private Declare Function FreeLibrary Lib "kernel32.dll" (ByVal hLibModule As Long) As Long
Private Declare Function CreateToolhelp32Snapshot Lib "kernel32" (ByVal lFlags As Long, ByVal lProcessID As Long) As Long
Private Declare Function Module32First Lib "kernel32" (ByVal hSnapshot As Long, uProcess As MODULEENTRY32) As Long
Private Declare Function Module32Next Lib "kernel32" (ByVal hSnapshot As Long, uProcess As MODULEENTRY32) As Long

Public fLog As Long
Private Const INVALID_FILE_ATTRIBUTES = -1
Private Declare Function GetFileAttributes Lib "kernel32" Alias "GetFileAttributesA" (ByVal lpFileName As String) As Long
Private Declare Function LoadLibrary Lib "kernel32" Alias "LoadLibraryA" (ByVal lpLibFileName As String) As Long
'Actually inject the DLL
Public Function Inject_Dll(Strdll As String, StrProcID As String)
Dim LoadlibAdr As Long, RemThread As Long, LngModule As Long, LngProcess As Long, LngBytes As Long, LngThreadID As Long
On Error GoTo ErrTrap
    LngProcess = OpenProcess(PROCESS_ALL_ACCESS, False, CLng(StrProcID))
    LoadlibAdr = GetProcAddress(GetModuleHandle("kernel32.dll"), "LoadLibraryA")
    LngModule = VirtualAllocEx(LngProcess, 0, Len(Strdll), MEM_COMMIT, PAGE_READWRITE)
    WriteProcessMemory LngProcess, ByVal LngModule, ByVal Strdll, Len(Strdll), LngBytes
    RemThread = CreateRemoteThread(LngProcess, ByVal 0, 0, ByVal LoadlibAdr, ByVal LngModule, 0, LngThreadID)
    WaitForSingleObject RemThread, INFINITE
    CloseHandle LngProcess
    CloseHandle RemThread

    Exit Function
ErrTrap:
    MsgBox "Error Injecting Dll!", vbCritical, "Injection Error"
End Function
 
Public Function UnInject_Dll(Strdll As String, StrProcID As String)
Dim MODE32 As MODULEENTRY32, LngBaseAddr As Long, RetVal As Long, LngCT32S As Long, LngProcess As Long, FreelibAdr As Long, RemThread As Long
On Error GoTo ErrTrap
    LngCT32S = CreateToolhelp32Snapshot(TH32CS_SNAPMODULE, CLng(StrProcID))
    MODE32.dwSize = Len(MODE32)
    RetVal = Module32First(LngCT32S, MODE32)
    Do While RetVal
        If Strdll = Left(MODE32.szExePath, InStr(MODE32.szExePath, Chr(0)) - 1) Then
            LngBaseAddr = MODE32.modBaseAddr
        End If
        RetVal = Module32Next(LngCT32S, MODE32)
    Loop
    CloseHandle LngCT32S
    LngProcess = OpenProcess(PROCESS_ALL_ACCESS, False, CLng(StrProcID))
    FreelibAdr = GetProcAddress(GetModuleHandle("Kernel32.dll"), "FreeLibrary")
    RemThread = CreateRemoteThread(LngProcess, ByVal 0, 0, ByVal FreelibAdr, ByVal LngBaseAddr, 0, 0)
    CloseHandle LngProcess
    CloseHandle RemThread

    Exit Function
ErrTrap:
    MsgBox "Error UnInjecting Dll!", vbCritical, "UnInjection Error"
End Function
Public Function GetRelativeEntryAddress(sLibrary As String, sEntryFunction As String) As Long
    Dim hLibrary As Long, lpFunction As Long

    If GetFileAttributes(sLibrary) = INVALID_FILE_ATTRIBUTES Then
        Print #fLog, "failed ... returned INVALID_FILE_ATTRIBUTES ."
        GetRelativeEntryAddress = 0
        Exit Function
    End If

    Debug.Print "Calling LoadLibrary ... " & sLibrary

    hLibrary = LoadLibrary(sLibrary)
    'If hLibrary = 0 Then
    '    Debug.Print "failed ... returned 0"
    '    GetRelativeEntryAddress = 0
    '    Exit Function
    'End If
    'Print #fLog, "OK, returned hLibrary = 0x" & Hex(hLibrary)

    Debug.Print "Calling GetProcAddress ..."

    lpFunction = GetProcAddress(hLibrary, sEntryFunction)
    If lpFunction = 0 Then
        Debug.Print "failed ... returned 0"
        GetRelativeEntryAddress = 0
        Exit Function
    End If

    Debug.Print "OK, returned lpFunction = 0x" & Hex(lpFunction)

    FreeLibrary hLibrary

    GetRelativeEntryAddress = lpFunction - hLibrary
    Debug.Print "GetRelativeEntryAddress returned 0x" & Hex(GetRelativeEntryAddress)
End Function

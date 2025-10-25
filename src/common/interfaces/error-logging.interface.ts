export interface StackFrame {
    file: string;           // Relative path from project root
    line: number;
    column: number;
    function: string;
    isApplicationCode: boolean;
    originalFrame: string;  // Original stack frame for reference
}

export interface FormattedStackTrace {
    applicationFrames: StackFrame[];
    dependencyFrames: StackFrame[];
    rawStack: string;
    summary: string;
}

export interface FileLocation {
    path: string;
    line: number;
    column: number;
}

export interface FormattedError {
    message: string;
    context: {
        requestId: string;
        timestamp: string;
        exception: {
            name: string;
            message: string;
            code?: string;
        };
        stackTrace: FormattedStackTrace;
        location?: {
            file: string;
            line: number;
            column: number;
        };
    };
}

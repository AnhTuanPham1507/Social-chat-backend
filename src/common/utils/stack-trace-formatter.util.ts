import * as path from 'path';
import { FileLocation, FormattedStackTrace, StackFrame } from '@common/interfaces/error-logging.interface';

export class StackTraceFormatter {
    private static readonly STACK_FRAME_REGEX = /^\s*at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)$|^\s*at\s+(.+?):(\d+):(\d+)$/;
    private static readonly PROJECT_ROOT = process.cwd();

    /**
     * Format a stack trace for better IDE navigation
     */
    public static formatStackTrace(stack: string): FormattedStackTrace {
        if (!stack) {
            return {
                applicationFrames: [],
                dependencyFrames: [],
                rawStack: '',
                summary: 'No stack trace available',
            };
        }

        const lines = stack.split('\n');
        const frames: StackFrame[] = [];

        for (const line of lines) {
            const frame = this.parseStackFrame(line.trim());
            if (frame) {
                frames.push(frame);
            }
        }

        const applicationFrames = frames.filter(frame => frame.isApplicationCode);
        const dependencyFrames = frames.filter(frame => !frame.isApplicationCode);

        const summary = this.generateSummary(applicationFrames);

        return {
            applicationFrames,
            dependencyFrames,
            rawStack: stack,
            summary,
        };
    }

    /**
     * Parse a single stack frame line
     */
    private static parseStackFrame(line: string): StackFrame | null {
        if (!line.startsWith('at ')) {
            return null;
        }

        const match = line.match(this.STACK_FRAME_REGEX);
        if (!match) {
            return null;
        }

        let functionName: string;
        let filePath: string;
        let lineNumber: number;
        let columnNumber: number;

        if (match[1] && match[2]) {
            // Format: at functionName (file:line:column)
            functionName = match[1];
            filePath = match[2];
            lineNumber = parseInt(match[3], 10);
            columnNumber = parseInt(match[4], 10);
        } else if (match[5]) {
            // Format: at file:line:column
            functionName = '<anonymous>';
            filePath = match[5];
            lineNumber = parseInt(match[6], 10);
            columnNumber = parseInt(match[7], 10);
        } else {
            return null;
        }

        const relativePath = this.getRelativePath(filePath);
        const isApplicationCode = this.isApplicationCode(filePath);

        return {
            file: relativePath,
            line: lineNumber,
            column: columnNumber,
            function: functionName,
            isApplicationCode,
            originalFrame: line,
        };
    }

    /**
     * Convert absolute path to relative path from project root
     */
    private static getRelativePath(filePath: string): string {
        try {
            // Handle Windows paths and normalize
            const normalizedPath = path.normalize(filePath);
            const relativePath = path.relative(this.PROJECT_ROOT, normalizedPath);
            
            // If the relative path goes up directories (starts with ..), 
            // it's likely a dependency, so keep the original path
            if (relativePath.startsWith('..')) {
                return filePath;
            }
            
            // Convert Windows backslashes to forward slashes for consistency
            return relativePath.replace(/\\/g, '/');
        } catch (error) {
            return filePath;
        }
    }

    /**
     * Determine if the file path is application code or dependency
     */
    private static isApplicationCode(filePath: string): boolean {
        const normalizedPath = path.normalize(filePath);
        
        // Check if it's in node_modules
        if (normalizedPath.includes('node_modules')) {
            return false;
        }
        
        // Check if it's within the project directory
        try {
            const relativePath = path.relative(this.PROJECT_ROOT, normalizedPath);
            return !relativePath.startsWith('..') && !path.isAbsolute(relativePath);
        } catch (error) {
            return false;
        }
    }

    /**
     * Extract the primary error location from stack trace
     */
    public static extractPrimaryLocation(stack: string): FileLocation | null {
        const formatted = this.formatStackTrace(stack);
        
        // Prefer application code frames
        const primaryFrame = formatted.applicationFrames[0] || formatted.dependencyFrames[0];
        
        if (!primaryFrame) {
            return null;
        }

        return {
            path: primaryFrame.file,
            line: primaryFrame.line,
            column: primaryFrame.column,
        };
    }

    /**
     * Generate a summary of the stack trace
     */
    private static generateSummary(applicationFrames: StackFrame[]): string {
        if (applicationFrames.length === 0) {
            return 'Error occurred in external dependencies';
        }

        const primaryFrame = applicationFrames[0];
        return `Error in ${primaryFrame.file}:${primaryFrame.line}:${primaryFrame.column} (${primaryFrame.function})`;
    }

    /**
     * Format stack frames for console output with clickable paths
     */
    public static formatFramesForConsole(frames: StackFrame[]): string[] {
        return frames.map(frame => {
            const location = `${frame.file}:${frame.line}:${frame.column}`;
            return `    at ${frame.function} (${location})`;
        });
    }
}

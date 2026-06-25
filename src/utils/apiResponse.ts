export interface ApiResponseFormat<T = any> {
    success: boolean;
    message: string;
    data?: T | undefined;
    error?: string;
    timestamp: string;
}

export class ApiResponse {
    static success<T>(message: string, data?: T): ApiResponseFormat<T> {
        return { success: true, message, data, timestamp: new Date().toISOString() };
    }

    static failure<T>(message: string, data?: T): ApiResponseFormat<T> {
        return { success: false, message, data, timestamp: new Date().toISOString() };
    }

    static error(errorName = "Internal Server Error", message: string): ApiResponseFormat {
        return { success: false, error: errorName, message, timestamp: new Date().toISOString() };
    }
}
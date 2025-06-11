// Returns the current date in a string in the following format: 'DD/MM/YYYY, HH:mm'
export function getTime(): string {
    const date = new Date(Date.now()).toLocaleString(
        'en-GB', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit', 
            hour12: false 
        }).toString();
    return date 
}

// Returns the current date in a string in the format of an ID for the chat name and thread ID
export function getTimeId(): string {
    return new Date().toISOString().replace(/[:.]/g, '-')
}
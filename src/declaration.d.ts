declare module '*.pegjs?raw' {
    const content: string;
    export default content;
}

declare module '*.js' {
    const content: any;
    export default content;
}

declare module '*.css' {
    const content: any;
    export default content;
}
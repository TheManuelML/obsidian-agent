// This file is used to declare custom types for TypeScript.
// It allows TypeScript to understand the types of certain files or modules that are not natively supported.
declare module "*.svg" {
    const content: React.FunctionComponent<React.SVGAttributes<SVGElement>>;
    export default content;
}
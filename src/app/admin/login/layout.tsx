export default function LoginLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // No sidebar or navigation — login page is public-facing
    return <>{children}</>;
}

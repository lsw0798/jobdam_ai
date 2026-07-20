export function ExternalLink({ children, href, ...props }) {
  return (
    <a href={href} rel="noreferrer" target="_blank" {...props}>
      {children}
    </a>
  );
}

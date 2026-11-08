export default function FormField({ label, name, required, error, children }) {
  return <div className="form-field"><label htmlFor={name}>{label}{required&&<span className="required-mark"> *</span>}</label>{children}{error&&<p className="field-error" role="alert">{error}</p>}</div>;
}

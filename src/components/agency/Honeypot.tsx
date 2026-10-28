/**
 * A field people never see but form-filling bots do. The API quietly drops
 * any message or viewing request that arrives with it filled in.
 */
export function Honeypot({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <label
      aria-hidden="true"
      style={{ position: "absolute", left: -10000, width: 1, height: 1, overflow: "hidden" }}
    >
      Leave this empty
      <input
        type="text"
        name="lv_check"
        tabIndex={-1}
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

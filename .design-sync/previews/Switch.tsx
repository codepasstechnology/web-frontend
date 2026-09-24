import { Label, Switch } from "land-eye-kenya-frontend";

export const SettingRow = () => (
  <div className="flex w-80 items-center justify-between rounded-lg border border-border bg-card p-4">
    <div>
      <p className="text-sm font-medium text-foreground">Two-factor authentication</p>
      <p className="text-xs text-muted-foreground">Require a code at every sign-in.</p>
    </div>
    <Switch defaultChecked />
  </div>
);

export const States = () => (
  <div className="grid gap-3">
    <div className="flex items-center gap-2">
      <Switch id="s1" defaultChecked />
      <Label htmlFor="s1">On</Label>
    </div>
    <div className="flex items-center gap-2">
      <Switch id="s2" />
      <Label htmlFor="s2">Off</Label>
    </div>
    <div className="flex items-center gap-2">
      <Switch id="s3" disabled />
      <Label htmlFor="s3" className="opacity-50">
        Disabled
      </Label>
    </div>
  </div>
);

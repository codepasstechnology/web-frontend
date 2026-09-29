import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "land-eye-kenya-frontend";

export const BetweenGroups = () => (
  <InputOTP maxLength={6} defaultValue="482913">
    <InputOTPGroup>
      <InputOTPSlot index={0} />
      <InputOTPSlot index={1} />
      <InputOTPSlot index={2} />
    </InputOTPGroup>
    <InputOTPSeparator />
    <InputOTPGroup>
      <InputOTPSlot index={3} />
      <InputOTPSlot index={4} />
      <InputOTPSlot index={5} />
    </InputOTPGroup>
  </InputOTP>
);

import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "land-eye-kenya-frontend";

export const VerificationCode = () => (
  <div className="grid gap-2">
    <p className="text-sm font-medium text-foreground">Enter the 6-digit code sent to 07•• ••• 214</p>
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
  </div>
);

export const Partial = () => (
  <InputOTP maxLength={6} defaultValue="48">
    <InputOTPGroup>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <InputOTPSlot key={i} index={i} />
      ))}
    </InputOTPGroup>
  </InputOTP>
);

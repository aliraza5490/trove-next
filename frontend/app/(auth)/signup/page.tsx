import { SignupForm } from "./components/SignupForm";
import { redirect } from "next/navigation";

const SignupPage = async () => {
  return (
    <div>
        <SignupForm />
    </div>
  );
}

export default SignupPage;
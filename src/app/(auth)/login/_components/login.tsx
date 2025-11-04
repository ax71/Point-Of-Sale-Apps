"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { LoginForm, loginSchemaForm } from "@/validations/auth-validation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  INITIAL_LOGIN_FORM,
  INITIAL_STATE_LOGIN_FORM,
} from "@/constants/auth-constant";
import { Button } from "@/components/ui/button";
import FormInput from "@/components/common/form-input";
import { startTransition, useActionState, useEffect } from "react";
import { login } from "../action";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Login() {
  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchemaForm),
    defaultValues: INITIAL_LOGIN_FORM,
  });

  const [loginState, loginAction, isPandingLogin] = useActionState(
    login,
    INITIAL_STATE_LOGIN_FORM
  );

  const onSubmit = form.handleSubmit(async (data) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, value);
    });

    startTransition(() => {
      loginAction(formData);
    });
  });

  useEffect(() => {
    if (loginState.status === "error") {
      toast.error("Login Field", {
        description: loginState.errors?._form?.[0],
      });
      startTransition(() => {
        loginAction(null);
      });
    }
  }, [loginState]);

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Welcome</CardTitle>
        <CardDescription>Login to your account</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4">
            <FormInput
              form={form}
              name="email"
              type="email"
              label="Email"
              placeholder="insert your email here"
            />
            <FormInput
              form={form}
              name="password"
              type="password"
              label="Password"
              placeholder="********"
            />
            <Button type="submit">
              {isPandingLogin ? <Loader2 className="animate-spin" /> : "Login"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

import { yupResolver } from "@hookform/resolvers/yup";
import { Lock as LockIcon, Person } from "@mui/icons-material";
import { Button, Card, CardContent, Typography } from "@mui/material";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import * as Yup from "yup";
import {
  FormInput,
  FormPassword,
} from "../../Components/form-component/FormComponent";
import supabase from "../../core/apis/supabase";
import { SignIn } from "../../Redux/reducers/AuthReducer";
import { ADMIN_ROLES } from "../../core/helpers/sessionRefresh";

const validationSchema = Yup.object({
  email: Yup.string().required("Email is required"),
  password: Yup.string().required("Password is required"),
});

export default function SignInPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  const { control, handleSubmit } = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    resolver: yupResolver(validationSchema),
    mode: "all",
  });

  const handleSubmitForm = async (payload) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: payload.email?.trim(),
        password: payload.password?.trim(),
      });
      if (error) {
        toast.error(error.message || "Failed to Sign in");
        return;
      }

      // Colonne users_copy.role (D5) — is_admin est abandonné : c'était
      // l'une des 2 sources du split-brain de rôles (admin_auth.py lit
      // déjà role côté back).
      const { data: profile, error: profileError } = await supabase
        .from("users_copy")
        .select("role")
        .eq("id", data.user.id)
        .single();

      const role = profile?.role;
      if (profileError || !ADMIN_ROLES.includes(role)) {
        await supabase.auth.signOut();
        toast.error("Access denied: account is not an admin");
        return;
      }

      dispatch(
        SignIn({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          // user_info COMPLET : le rôle voyage dans Redux (persisté) et
          // est re-fetché à chaque refresh de session (B2)
          user_info: { ...data.user, role },
        })
      );
      navigate("/users");
    } catch (e) {
      toast.error(e?.message || "Failed to Sign in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={"flex items-center justify-center min-h-[calc(100vh-180px)]"}
    >
      <Card sx={{ maxWidth: "400px" }}>
        <CardContent className={"flex flex-col gap-[0.5rem]"}>
          <Typography variant="h4" gutterBottom align="center">
            Sign In
          </Typography>
          <form
            className="flex flex-col gap-[1rem]"
            onSubmit={handleSubmit(handleSubmitForm)}
          >
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email
              </label>
              <Controller
                render={({
                  field: { onChange, value },
                  fieldState: { error },
                }) => (
                  <FormInput
                    placeholder={"Enter email"}
                    value={value}
                    helperText={error?.message}
                    onChange={(value) => onChange(value)}
                    startAdornment={<Person />}
                  />
                )}
                name="email"
                control={control}
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium mb-2"
              >
                Password
              </label>
              <Controller
                render={({
                  field: { onChange, value },
                  fieldState: { error },
                }) => (
                  <FormPassword
                    placeholder={"Enter password"}
                    value={value}
                    helperText={error?.message}
                    onChange={(value) => onChange(value)}
                    startAdornment={<LockIcon />}
                  />
                )}
                name="password"
                control={control}
              />
            </div>
            <Button
              variant={"contained"}
              color="primary"
              type="submit"
              disabled={loading}
            >
              {loading ? "Loading..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

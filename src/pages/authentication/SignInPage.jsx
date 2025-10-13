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

    await supabase.auth
      .signInWithPassword({
        email: payload.email,
        password: payload.password,
      })
      .then((res) => {
        if (res?.error) {
          toast.error(res?.error?.message || "Failed to Sign in");
          console.error("Error fetching data:", res?.error?.code);
        } else {
          dispatch(
            SignIn({
              access_token: res.data.session.access_token,
              refresh_token: res?.data?.session?.refresh_token,
              user_info: res.data.user,
            })
          );
          navigate("/users");
        }
      })
      .catch((e) => {
        toast.error(e?.message || "Failed to Sign in");
      })
      .finally(() => {
        setLoading(false);
      });
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

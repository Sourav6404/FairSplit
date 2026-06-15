import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EyeOff, Eye, ArrowLeft, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import authBg from "@/assets/auth-bg-2.png";

const loginSchema = z.object({
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export function Auth() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLogin, setIsLogin] = useState(true);

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { phoneNumber: "", password: "" },
  });

  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", phoneNumber: "", password: "" },
  });

  const onLogin = async (data: z.infer<typeof loginSchema>) => {
    setIsLoading(true);
    try {
      const response = await apiFetch("/auth/login/", {
        method: "POST",
        body: JSON.stringify({
          username: data.phoneNumber,
          password: data.password,
        }),
      });
      localStorage.setItem("access_token", response.access);
      localStorage.setItem("refresh_token", response.refresh);
      navigate("/dashboard");
    } catch (error) {
      console.error("Login failed", error);
      alert("Login failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const onRegister = async (data: z.infer<typeof registerSchema>) => {
    setIsLoading(true);
    try {
      await apiFetch("/auth/register/", {
        method: "POST",
        body: JSON.stringify({
          username: data.phoneNumber,
          email: `${data.phoneNumber}@fairsplit.com`,
          password: data.password,
          first_name: data.name,
        }),
      });
      // After successful registration, log them in
      await onLogin({ phoneNumber: data.phoneNumber, password: data.password });
    } catch (error) {
      console.error("Registration failed", error);
      alert("Registration failed. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#eaf5ef] flex items-center justify-center p-4">
      <div className="w-full max-w-[1000px] h-[600px] bg-[#f7f8fc] rounded-3xl overflow-hidden shadow-2xl relative">
        
        {/* Left Side: Login Form */}
        <div className="absolute w-1/2 h-full left-0 p-12 flex flex-col justify-center">
          <AnimatePresence>
            {isLogin && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="max-w-xs mx-auto w-full"
              >
                <h1 className="text-3xl font-semibold text-gray-900 mb-8">Hello Again!</h1>
                
                <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                  <div className="space-y-1">
                    <div className="relative">
                      <Input 
                        placeholder="Phone Number" 
                        className="h-12 bg-white border-none rounded-xl px-4 text-sm shadow-sm"
                        {...loginForm.register("phoneNumber")} 
                      />
                    </div>
                    {loginForm.formState.errors.phoneNumber && (
                      <p className="text-xs text-red-500 pl-1">{loginForm.formState.errors.phoneNumber.message}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="relative">
                      <Input 
                        type={showPassword ? "text" : "password"} 
                        placeholder="Password" 
                        className="h-12 bg-white border-none rounded-xl px-4 text-sm shadow-sm pr-10"
                        {...loginForm.register("password")} 
                      />
                      <button 
                        type="button" 
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                      </button>
                    </div>
                    {loginForm.formState.errors.password && (
                      <p className="text-xs text-red-500 pl-1">{loginForm.formState.errors.password.message}</p>
                    )}
                  </div>

                  <div className="flex justify-end pt-1 pb-4">
                    <button type="button" className="text-xs text-gray-400 font-medium hover:text-gray-600">
                      Recovery Password
                    </button>
                  </div>

                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full h-12 rounded-xl bg-[#1d6b46] hover:bg-[#155436] text-white font-medium shadow-[0_8px_15px_-3px_rgba(29,107,70,0.4)] transition-all"
                  >
                    {isLoading ? "Signing In..." : "Sign In"}
                  </Button>
                </form>

                <div className="mt-8 text-center">
                  <p className="text-sm text-gray-500">
                    No account?{" "}
                    <button 
                      type="button" 
                      onClick={() => setIsLogin(false)}
                      className="text-[#1d6b46] font-semibold hover:underline"
                    >
                      Create account
                    </button>
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Side: Register Form */}
        <div className="absolute w-1/2 h-full right-0 p-12 flex flex-col justify-center">
          <AnimatePresence>
            {!isLogin && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="max-w-xs mx-auto w-full"
              >
                <h1 className="text-3xl font-semibold text-gray-900 mb-8">Create Account</h1>
                
                <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                  <div className="space-y-1">
                    <div className="relative">
                      <Input 
                        placeholder="Full Name" 
                        className="h-12 bg-white border-none rounded-xl px-4 text-sm shadow-sm"
                        {...registerForm.register("name")} 
                      />
                    </div>
                    {registerForm.formState.errors.name && (
                      <p className="text-xs text-red-500 pl-1">{registerForm.formState.errors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="relative">
                      <Input 
                        placeholder="Phone Number" 
                        className="h-12 bg-white border-none rounded-xl px-4 text-sm shadow-sm"
                        {...registerForm.register("phoneNumber")} 
                      />
                    </div>
                    {registerForm.formState.errors.phoneNumber && (
                      <p className="text-xs text-red-500 pl-1">{registerForm.formState.errors.phoneNumber.message}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="relative">
                      <Input 
                        type={showPassword ? "text" : "password"} 
                        placeholder="Password" 
                        className="h-12 bg-white border-none rounded-xl px-4 text-sm shadow-sm pr-10"
                        {...registerForm.register("password")} 
                      />
                      <button 
                        type="button" 
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                      </button>
                    </div>
                    {registerForm.formState.errors.password && (
                      <p className="text-xs text-red-500 pl-1">{registerForm.formState.errors.password.message}</p>
                    )}
                  </div>

                  <div className="pt-2">
                    <Button 
                      type="submit" 
                      disabled={isLoading}
                      className="w-full h-12 rounded-xl bg-[#1d6b46] hover:bg-[#155436] text-white font-medium shadow-[0_8px_15px_-3px_rgba(29,107,70,0.4)] transition-all"
                    >
                      {isLoading ? "Creating..." : "Sign Up"}
                    </Button>
                  </div>
                </form>

                <div className="mt-8 text-center">
                  <p className="text-sm text-gray-500">
                    Already have an account?{" "}
                    <button 
                      type="button" 
                      onClick={() => setIsLogin(true)}
                      className="text-[#1d6b46] font-semibold hover:underline"
                    >
                      Sign in
                    </button>
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sliding Image Panel */}
        <motion.div 
          className="absolute top-0 bottom-0 left-0 w-1/2 p-3 z-10"
          animate={{ x: isLogin ? "100%" : "0%" }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <div className="w-full h-full rounded-[1.5rem] overflow-hidden relative shadow-lg">
            <img 
              src={authBg} 
              alt="Auth Illustration" 
              className="w-full h-full object-cover"
            />
            
            {/* Overlay Elements */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
            
            <div className="absolute bottom-10 left-8 right-8 flex justify-between items-end">
              <p className="text-white text-lg font-medium opacity-90 max-w-[200px]">
                {isLogin ? "Fair splits, no stress." : "Start sharing expenses seamlessly."}
              </p>
              
              <div className="flex gap-2">
                <button className="w-8 h-8 rounded-full border border-white/50 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors">
                  <ArrowLeft size={14} />
                </button>
                <button className="w-8 h-8 rounded-full border border-white/50 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors">
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}

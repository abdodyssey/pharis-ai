"use client";

import { useState, useEffect } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
  UserIcon, 
  Mail01Icon, 
  Camera01Icon,
  Tick01Icon,
  SecurityIcon,
  Loading01Icon,
  CrownIcon 
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase";
import ChangePasswordModal from "@/components/shared/ChangePasswordModal";
import type { User } from "@supabase/supabase-js";

export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null);
  const [fullName, setFullName] = useState("");
  const [planType, setPlanType] = useState("free");
  const [isUpdating, setIsUpdating] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    async function getProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        setFullName(user.user_metadata?.full_name || "");
        
        // Sync plan from DB
        const { data: subData } = await supabase
          .from("user_subscriptions")
          .select("plan_type")
          .eq("user_id", user.id)
          .maybeSingle();
        
        setPlanType(user.user_metadata?.plan_type || subData?.plan_type || "free");
      }
    }
    getProfile();
  }, []);

  const handleUpdate = async () => {
    if (isUpdating) return;
    setIsUpdating(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: fullName }
      });
      
      if (error) throw error;
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      console.error("Profile Update Error:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  const getMemberSince = () => {
    if (!user?.created_at) return "2024";
    const date = new Date(user.created_at);
    return date.getFullYear().toString();
  };

  return (
    <main className="max-w-5xl mx-auto p-6 md:p-8 space-y-10 min-h-screen bg-transparent animate-in fade-in duration-500">
      {/* Header */}
      <div className="space-y-1.5 pt-4">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Account Settings</h1>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Manage your profile information and security preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left: Profile Summary */}
        <div className="lg:col-span-4 space-y-6">
           <div className="relative group overflow-hidden bg-white dark:bg-obsidian-1 border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm">
              <div className="aspect-square flex items-center justify-center bg-slate-50 dark:bg-obsidian-2/50 relative">
                <HugeiconsIcon icon={UserIcon} size={80} className="text-slate-300 dark:text-slate-700" />
                
                <button className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center text-white gap-2 backdrop-blur-[2px]">
                   <HugeiconsIcon icon={Camera01Icon} size={20} />
                   <span className="text-[10px] font-bold tracking-tight">Change Avatar</span>
                </button>
              </div>
              
              <div className="p-5 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-obsidian-2/30">
                 <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                   {fullName || "Pharis Researcher"}
                 </h3>
                 <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate mt-0.5">
                   {user?.email}
                 </p>
                 <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-white/5">
                    {planType === "pro" || planType === "inst" ? (
                      <span className="px-2 py-0.5 bg-accent-lime text-obsidian-0 text-[10px] font-black rounded-md flex items-center gap-1 shadow-lg shadow-accent-lime/20">
                        <HugeiconsIcon icon={CrownIcon} size={12} fill="currentColor" />
                        {planType === "pro" ? "Education Plan" : "Institutional"}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-obsidian-2 text-slate-500 dark:text-slate-400 text-[10px] font-bold rounded-md border border-slate-200 dark:border-white/5 lowercase tracking-tight">
                        free plan
                      </span>
                    )}
                    <span className="text-[9px] font-medium text-slate-400 italic">Member since {getMemberSince()}</span>
                 </div>
              </div>
           </div>
        </div>

        {/* Right: Detailed Settings */}
        <div className="lg:col-span-8 space-y-8">
           {/* Basic Information */}
           <section className="bg-white dark:bg-obsidian-1 border border-slate-200 dark:border-white/5 rounded-2xl p-6 md:p-8 space-y-6 shadow-sm">
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 bg-slate-50 dark:bg-accent-lime/10 rounded-lg flex items-center justify-center text-slate-400 dark:text-accent-lime border border-slate-100 dark:border-accent-lime/20">
                    <HugeiconsIcon icon={UserIcon} size={16} />
                 </div>
                 <h4 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">Basic Information</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 ml-1">Full Name</label>
                    <div className="relative group">
                       <HugeiconsIcon icon={UserIcon} className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300 dark:text-slate-600 group-focus-within:text-accent-lime transition-colors" />
                       <input 
                         type="text" 
                         value={fullName}
                         onChange={(e) => setFullName(e.target.value)}
                         placeholder="Enter your name"
                         className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-obsidian-2 border border-slate-200 dark:border-white/5 rounded-xl text-xs font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-accent-lime/10 focus:border-accent-lime/30 focus:bg-white dark:focus:bg-obsidian-1 transition-all"
                       />
                    </div>
                 </div>

                 <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 ml-1 tracking-tight">Email Address</label>
                    <div className="relative">
                       <HugeiconsIcon icon={Mail01Icon} className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300 dark:text-slate-800" />
                       <input 
                         type="email" 
                         disabled
                         value={user?.email || ""}
                         className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 dark:bg-obsidian-2/50 border border-slate-100 dark:border-white/5 rounded-xl text-xs font-medium text-slate-400 dark:text-slate-600 cursor-not-allowed italic"
                       />
                    </div>
                 </div>
              </div>
           </section>

           {/* Security Settings */}
           <section className="bg-white dark:bg-obsidian-1 border border-slate-200 dark:border-white/5 rounded-2xl p-6 md:p-8 space-y-6 shadow-sm">
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 bg-slate-50 dark:bg-accent-lime/10 rounded-lg flex items-center justify-center text-slate-400 dark:text-accent-lime border border-slate-100 dark:border-accent-lime/20">
                    <HugeiconsIcon icon={SecurityIcon} size={16} />
                 </div>
                 <h4 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">Security & Auth</h4>
              </div>

              <div className="space-y-4">
                 <div className="flex items-center justify-between p-5 bg-slate-50/50 dark:bg-obsidian-2/30 border border-slate-100 dark:border-white/5 rounded-xl transition-all hover:border-slate-200 dark:hover:border-white/10 group">
                    <div className="space-y-1">
                       <p className="text-xs font-bold text-slate-800 dark:text-white">Password Management</p>
                       <p className="text-[10px] text-slate-400 font-medium">Update your account access credentials directly</p>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsChangingPassword(true)}
                      className="h-8 rounded-lg px-4 text-[10px] font-bold border-slate-200 dark:border-white/10 text-slate-500 hover:text-slate-950 dark:hover:text-white transition-all">
                       Change
                    </Button>
                 </div>

                 <div className="flex items-center justify-between p-5 bg-slate-50/50 dark:bg-obsidian-2/30 border border-slate-100 dark:border-white/5 rounded-xl opacity-60 grayscale group">
                    <div className="space-y-1">
                       <p className="text-xs font-bold text-slate-800 dark:text-white">Two-Factor Auth</p>
                       <p className="text-[10px] text-slate-400 font-medium">Add an extra layer of protection</p>
                    </div>
                    <Button variant="outline" className="h-8 rounded-lg px-4 text-[10px] font-bold border-slate-200 dark:border-white/10 text-slate-400 cursor-not-allowed">
                       Enable
                    </Button>
                 </div>
              </div>
           </section>

           {/* Form Actions */}
           <div className="flex items-center justify-end pt-4">
              <button 
                onClick={handleUpdate}
                disabled={isUpdating}
                className="flex items-center justify-center gap-2 px-8 py-3 bg-slate-950 dark:bg-accent-lime text-white dark:text-slate-950 rounded-xl font-bold text-xs hover:bg-slate-800 dark:hover:bg-white transition-all shadow-lg shadow-slate-200 dark:shadow-none min-w-[160px]"
              >
                {isUpdating ? (
                  <HugeiconsIcon icon={Loading01Icon} className="w-3.5 h-3.5 animate-spin" />
                ) : success ? (
                  <>
                    <HugeiconsIcon icon={Tick01Icon} size={14} className="text-emerald-500 dark:text-slate-950" />
                    <span>Saved Successfully</span>
                  </>
                ) : (
                  <span>Save Changes</span>
                )}
              </button>
           </div>
        </div>
      </div>
      <ChangePasswordModal 
        isOpen={isChangingPassword}
        onOpenChange={setIsChangingPassword}
      />
    </main>
  );
}

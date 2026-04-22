import { useEffect, useRef, useState } from "react";
import { useGetMe, useUpdateMe, getGetMeQueryKey, getGetStatsSummaryQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import { Loader2, Plus, X, User as UserIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";

const profileSchema = z.object({
  fullName: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  headline: z.string().optional(),
  location: z.string().optional(),
  yearsExperience: z.coerce.number().min(0).max(50).optional(),
  skills: z.array(z.string()),
  desiredRole: z.string().optional(),
  openToRemote: z.boolean().default(false),
  cvText: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { data: me, isLoading } = useGetMe();
  const updateMe = useUpdateMe();
  const queryClient = useQueryClient();
  
  const [skillInput, setSkillInput] = useState("");
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: "",
      email: "",
      headline: "",
      location: "",
      yearsExperience: 0,
      skills: [],
      desiredRole: "",
      openToRemote: false,
      cvText: "",
    },
  });

  const initializedForId = useRef<string | null>(null);

  // Initialize form with server data
  useEffect(() => {
    if (me && initializedForId.current !== me.id) {
      initializedForId.current = me.id;
      form.reset({
        fullName: me.fullName || "",
        email: me.email || "",
        headline: me.headline || "",
        location: me.location || "",
        yearsExperience: me.yearsExperience || 0,
        skills: me.skills || [],
        desiredRole: me.desiredRole || "",
        openToRemote: me.openToRemote || false,
        cvText: me.cvText || "",
      });
    }
  }, [me, form]);

  const onSubmit = (data: ProfileFormValues) => {
    const updatePromise = updateMe.mutateAsync({ data });
    
    toast.promise(updatePromise, {
      loading: 'Saving profile...',
      success: () => {
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetStatsSummaryQueryKey() });
        return 'Profile updated successfully';
      },
      error: 'Failed to update profile',
    });
  };

  // Live auto-save on blur or when certain fields change
  const handleAutoSave = () => {
    form.handleSubmit(onSubmit)();
  };

  const handleAddSkill = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && skillInput.trim()) {
      e.preventDefault();
      const currentSkills = form.getValues("skills") || [];
      if (!currentSkills.includes(skillInput.trim())) {
        form.setValue("skills", [...currentSkills, skillInput.trim()], { shouldDirty: true });
      }
      setSkillInput("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    const currentSkills = form.getValues("skills") || [];
    form.setValue("skills", currentSkills.filter(s => s !== skillToRemove), { shouldDirty: true });
    // Auto-save when skills change
    handleAutoSave();
  };

  // Calculate completeness based on form values instead of 'me' for real-time feedback
  const watchAllFields = form.watch();
  const completeness = Object.entries(watchAllFields).reduce((acc, [key, value]) => {
    if (key === 'openToRemote') return acc; // boolean
    if (Array.isArray(value) && value.length > 0) return acc + 12.5;
    if (typeof value === 'string' && value.trim().length > 0) return acc + 12.5;
    if (typeof value === 'number' && value > 0) return acc + 12.5;
    return acc;
  }, 0);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold">Profile</h1>
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="p-6 pb-2 border-b border-border/50 sticky top-0 z-10 bg-background/80 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold tracking-tight">Your Profile</h1>
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            <UserIcon className="w-5 h-5 text-muted-foreground" />
          </div>
        </div>
        
        <div className="space-y-1 mb-2">
          <div className="flex justify-between text-sm font-medium">
            <span className="text-muted-foreground">Profile Completeness</span>
            <span className="text-primary">{Math.min(100, Math.round(completeness))}%</span>
          </div>
          <Progress value={Math.min(100, completeness)} className="h-2 bg-muted/50" />
        </div>
      </div>

      <ScrollArea className="flex-1 p-6 pb-24">
        <Form {...form}>
          <form onBlur={handleAutoSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Jane Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="jane@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="headline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Professional Headline</FormLabel>
                  <FormControl>
                    <Input placeholder="Senior Frontend Engineer @ Tech Corp" {...field} />
                  </FormControl>
                  <FormDescription>Shown right below your name to employers.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="Zürich, Switzerland" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="yearsExperience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Years of Experience</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" placeholder="5" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="skills"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Skills</FormLabel>
                  <div className="flex flex-col gap-3">
                    <div className="flex gap-2">
                      <FormControl>
                        <Input 
                          placeholder="Type a skill and press Enter (e.g. React, Python)" 
                          value={skillInput}
                          onChange={(e) => setSkillInput(e.target.value)}
                          onKeyDown={handleAddSkill}
                          onBlur={(e) => {
                            if (skillInput.trim()) {
                              handleAddSkill({ key: "Enter", preventDefault: () => {} } as any);
                            }
                          }}
                        />
                      </FormControl>
                      <Button 
                        type="button" 
                        variant="secondary" 
                        size="icon" 
                        onClick={() => {
                          if (skillInput.trim()) {
                            handleAddSkill({ key: "Enter", preventDefault: () => {} } as any);
                          }
                        }}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    {field.value?.length > 0 && (
                      <div className="flex flex-wrap gap-2 p-3 bg-muted/30 rounded-xl border border-border/50 min-h-[3rem]">
                        {field.value.map(skill => (
                          <Badge key={skill} variant="secondary" className="flex items-center gap-1 pl-2 pr-1 py-1">
                            {skill}
                            <button 
                              type="button"
                              onClick={() => removeSkill(skill)}
                              className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-muted-foreground/20 text-muted-foreground transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="desiredRole"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Desired Role</FormLabel>
                    <FormControl>
                      <Input placeholder="Full Stack Developer" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="openToRemote"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-xl border border-border/50 bg-muted/20 p-4 pt-4 mt-2">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Open to Remote</FormLabel>
                      <FormDescription>
                        Match with remote-friendly roles
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={(val) => {
                          field.onChange(val);
                          handleAutoSave();
                        }}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="cvText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CV / Resume Text</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Paste the text content of your CV here. This will be sent to employers when you confirm a match." 
                      className="min-h-[250px] font-mono text-sm leading-relaxed resize-none"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Plain text format is best. Employers read this directly in the app.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* The form auto-saves on blur, but keeping a manual save button is good UX */}
            <div className="pt-4 flex justify-end">
              <Button type="submit" onClick={handleAutoSave} disabled={updateMe.isPending} className="shadow-md">
                {updateMe.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </form>
        </Form>
      </ScrollArea>
    </div>
  );
}

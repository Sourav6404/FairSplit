import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, Users, ArrowUpRight, ArrowDownLeft } from "lucide-react";

export function Groups() {
  const navigate = useNavigate();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [members, setMembers] = useState([{ name: "", phone: "" }]);
  const [groups, setGroups] = useState<any[]>([]);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const data = await apiFetch("/groups/");
        setGroups(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchGroups();
  }, []);

  const displayGroups = groups.map((g: any) => {
    const balance = g.balance ?? 0;
    let type = "settled";
    if (balance > 0) type = "owe_you";
    else if (balance < 0) type = "you_owe";
    
    return {
      id: String(g.id),
      name: g.name,
      members: g.members?.length || 0,
      balance: balance,
      type: type
    };
  });

  const handleAddMember = () => setMembers([...members, { name: "", phone: "" }]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const filteredMembers = members.filter(m => m.name.trim() !== "" || m.phone.trim() !== "");
      await apiFetch("/groups/", {
        method: "POST",
        body: JSON.stringify({
          name: groupName,
          members: filteredMembers
        })
      });
      setIsCreateOpen(false);
      setGroupName("");
      setMembers([{ name: "", phone: "" }]);
      
      // Re-fetch groups
      const data = await apiFetch("/groups/");
      setGroups(data);
    } catch (err) {
      console.error(err);
      alert("Failed to create group.");
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Your Groups</h1>
          <p className="text-muted-foreground">Manage your shared expenses.</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <PlusCircle size={16} />
              Create Group
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Group</DialogTitle>
              <DialogDescription>
                Add members to start splitting expenses.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Group Name</Label>
                <Input 
                  id="name" 
                  placeholder="e.g. Goa Trip" 
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  required 
                />
              </div>
              <div className="space-y-4">
                <Label>Members</Label>
                {members.map((m, idx) => (
                  <div key={idx} className="flex gap-2">
                    <Input 
                      placeholder="Name" 
                      className="flex-1" 
                      value={m.name}
                      onChange={(e) => {
                        const newMembers = [...members];
                        newMembers[idx].name = e.target.value;
                        setMembers(newMembers);
                      }}
                    />
                    <Input 
                      placeholder="Phone" 
                      className="flex-1" 
                      value={m.phone}
                      onChange={(e) => {
                        const newMembers = [...members];
                        newMembers[idx].phone = e.target.value;
                        setMembers(newMembers);
                      }}
                    />
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={handleAddMember} className="w-full">
                  <PlusCircle size={14} className="mr-2" /> Add Another Member
                </Button>
              </div>
              <Button type="submit" className="w-full">Create Group</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {displayGroups.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center py-20">
          <div className="text-6xl mb-4">👥</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No groups yet</h3>
          <p className="text-gray-500 max-w-sm">Create a group to start splitting expenses with friends.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {displayGroups.map((group) => (
            <Card 
              key={group.id} 
              className="cursor-pointer hover:shadow-md transition-shadow hover:border-primary/50"
              onClick={() => navigate(`/groups/${group.id}`)}
            >
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="font-bold text-xl">{group.name}</div>
                  <div className="flex items-center text-muted-foreground bg-muted px-2 py-1 rounded-full text-xs">
                    <Users size={12} className="mr-1" /> {group.members}
                  </div>
                </div>
                <div className="flex items-end justify-between">
                  <div className="text-sm text-muted-foreground">
                    {group.type === "owe_you" ? "You are owed" : group.type === "you_owe" ? "You owe" : "Settled up"}
                  </div>
                  <div className={`font-bold flex items-center gap-1 ${
                    group.type === "owe_you" ? "text-green-500" : group.type === "you_owe" ? "text-red-500" : "text-muted-foreground"
                  }`}>
                    {group.type === "owe_you" && <ArrowUpRight size={16} />}
                    {group.type === "you_owe" && <ArrowDownLeft size={16} />}
                    ₹{Math.abs(group.balance)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

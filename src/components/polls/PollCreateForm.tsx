"use client";

import React, { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PollOption {
  id: string;
  text: string;
}

interface PollCreateFormProps {
  onSubmit: (pollData: {
    title: string;
    description: string;
    options: string[];
    anonymous: boolean;
  }) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function PollCreateForm({
  onSubmit,
  onCancel,
  isLoading = false,
}: PollCreateFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [options, setOptions] = useState<PollOption[]>([
    { id: "1", text: "" },
    { id: "2", text: "" },
  ]);

  const addOption = () => {
    const newOption: PollOption = {
      id: Date.now().toString(),
      text: "",
    };
    setOptions([...options, newOption]);
  };

  const removeOption = (optionId: string) => {
    if (options.length > 2) {
      setOptions(options.filter((option) => option.id !== optionId));
    }
  };

  const updateOption = (optionId: string, text: string) => {
    setOptions(
      options.map((option) =>
        option.id === optionId ? { ...option, text } : option,
      ),
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      return;
    }

    const validOptions = options
      .filter((option) => option.text.trim() !== "")
      .map((option) => option.text.trim());

    if (validOptions.length < 2) {
      return;
    }

    onSubmit({
      title: title.trim(),
      description: description.trim(),
      options: validOptions,
      anonymous: true, // Default to anonymous for now
    });

    // Reset form
    setTitle("");
    setDescription("");
    setOptions([
      { id: "1", text: "" },
      { id: "2", text: "" },
    ]);
  };

  return (
    <Card className="bg-green-50 border-green-200">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Create New Poll</CardTitle>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="pollTitle">Poll Title</Label>
            <Input
              id="pollTitle"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What's your favorite session?"
              className="bg-white"
              disabled={isLoading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pollDescription">Description (optional)</Label>
            <Textarea
              id="pollDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Additional details about the poll..."
              className="min-h-[100px] resize-none bg-white"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-3">
            <Label>Poll Options</Label>
            <div className="space-y-2">
              {options.map((option, index) => (
                <div key={option.id} className="flex items-center gap-2">
                  <Input
                    value={option.text}
                    onChange={(e) => updateOption(option.id, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    className="bg-white flex-1"
                    disabled={isLoading}
                  />
                  {options.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeOption(option.id)}
                      className="text-red-500 hover:text-red-700 p-2"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addOption}
              className="w-full"
              disabled={isLoading}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Option
            </Button>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              className="bg-green-600 hover:bg-green-700 flex-1"
              disabled={
                isLoading ||
                !title.trim() ||
                options.filter((opt) => opt.text.trim()).length < 2
              }
            >
              {isLoading ? "Creating..." : "Create Poll"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1"
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

"use client";

import React, { useState } from "react";
import { Plus, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import PollCreateForm from "./PollCreateForm";
import PollCard from "./PollCard";

interface PollOption {
  id: string;
  option_text: string;
  vote_count: number | null;
}

interface Poll {
  id: string;
  title: string;
  description?: string | null;
  anonymous: boolean | null;
  active: boolean | null;
  options: PollOption[];
  created_at: string | null;
}

interface PollsSectionProps {
  polls: Poll[];
  onCreatePoll: (pollData: {
    title: string;
    description: string;
    options: string[];
    anonymous: boolean;
  }) => Promise<void>;
  onVote: (pollId: string, optionId: string) => Promise<void>;
  onToggleActive: (pollId: string, active: boolean) => Promise<void>;
  onDeletePoll: (pollId: string) => Promise<void>;
  userVotes?: Record<string, string>; // pollId -> optionId
  isLoading?: boolean;
  canManage?: boolean;
}

export default function PollsSection({
  polls,
  onCreatePoll,
  onVote,
  onToggleActive,
  onDeletePoll,
  userVotes = {},
  isLoading = false,
  canManage = false,
}: PollsSectionProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [pollsEnabled, setPollsEnabled] = useState(true);

  const handleCreatePoll = async (pollData: {
    title: string;
    description: string;
    options: string[];
    anonymous: boolean;
  }) => {
    try {
      await onCreatePoll(pollData);
      setShowCreateForm(false);
    } catch (error) {
      console.error("Error creating poll:", error);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Checkbox
              id="eventPolls"
              checked={pollsEnabled}
              onCheckedChange={(checked) => setPollsEnabled(checked === true)}
              disabled={!canManage}
            />
            <Label htmlFor="eventPolls" className="text-lg font-semibold">
              Event Polls
            </Label>
          </div>
          <div className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
            Anonymous
          </div>
        </div>
        {canManage && pollsEnabled && (
          <Button
            type="button"
            onClick={() => setShowCreateForm(!showCreateForm)}
            size="sm"
            className="bg-green-600 hover:bg-green-700"
            disabled={isLoading}
          >
            <Plus className="h-4 w-4 mr-1" />
            New Poll
          </Button>
        )}
      </div>

      {pollsEnabled && (
        <>
          {/* Create Poll Form */}
          {showCreateForm && (
            <PollCreateForm
              onSubmit={handleCreatePoll}
              onCancel={() => setShowCreateForm(false)}
              isLoading={isLoading}
            />
          )}

          {/* Polls List */}
          {polls.length > 0 ? (
            <div className="space-y-4">
              {polls.map((poll) => (
                <PollCard
                  key={poll.id}
                  poll={poll}
                  onVote={onVote}
                  onToggleActive={onToggleActive}
                  onDelete={onDeletePoll}
                  hasVoted={!!userVotes[poll.id]}
                  userVote={userVotes[poll.id]}
                  isLoading={isLoading}
                  canManage={canManage}
                />
              ))}
            </div>
          ) : (
            !showCreateForm && (
              <div className="text-center py-8 text-gray-500">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="font-medium mb-2">No polls yet</h3>
                <p className="text-sm">
                  {canManage
                    ? "Create your first poll to engage with your audience"
                    : "The organizer hasn't created any polls yet"}
                </p>
              </div>
            )
          )}
        </>
      )}

      {!pollsEnabled && (
        <div className="text-center py-8 text-gray-500">
          <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="font-medium mb-2">Polls disabled</h3>
          <p className="text-sm">
            {canManage
              ? "Enable polls to start collecting audience feedback"
              : "Polls are currently disabled for this event"}
          </p>
        </div>
      )}
    </div>
  );
}

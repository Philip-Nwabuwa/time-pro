"use client";

import React, { useState, useRef, useEffect } from "react";
import { Search, User, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { usePageMembers } from "@/lib/api/hooks";
import type { Member } from "@/lib/api/types";

interface MemberSearchInputProps {
  pageId: string;
  value: string;
  onChange: (value: string) => void;
  onMemberSelect?: (member: Member) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
}

export default function MemberSearchInput({
  pageId,
  value,
  onChange,
  onMemberSelect,
  placeholder = "Search members or enter name...",
  label,
  disabled = false,
}: MemberSearchInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: members, isLoading } = usePageMembers(pageId);

  // Filter members based on search query
  const filteredMembers = members?.filter((member) => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      member.name.toLowerCase().includes(query) ||
      member.email.toLowerCase().includes(query)
    );
  }) || [];

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchQuery(newValue);
    onChange(newValue);
    setIsOpen(true);
  };

  // Handle member selection
  const handleMemberSelect = (member: Member) => {
    setSearchQuery(member.name);
    onChange(member.name);
    setIsOpen(false);
    onMemberSelect?.(member);
  };

  // Handle input focus
  const handleFocus = () => {
    if (!disabled) {
      setIsOpen(true);
    }
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Sync external value changes
  useEffect(() => {
    setSearchQuery(value);
  }, [value]);

  const showDropdown = isOpen && !disabled && (isLoading || filteredMembers.length > 0);

  return (
    <div className="relative">
      {label && (
        <Label htmlFor="member-search" className="text-sm font-medium text-gray-700">
          {label}
        </Label>
      )}
      
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          ref={inputRef}
          id="member-search"
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={handleFocus}
          placeholder={placeholder}
          disabled={disabled}
          className="pl-10"
        />
      </div>

      {showDropdown && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {isLoading ? (
            <div className="p-3 text-sm text-gray-500 text-center">
              Loading members...
            </div>
          ) : filteredMembers.length > 0 ? (
            <div className="py-1">
              {filteredMembers.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => handleMemberSelect(member)}
                  className="w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none flex items-center gap-3"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={member.avatar} alt={member.name} />
                    <AvatarFallback className="bg-green-100 text-green-600">
                      {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {member.name}
                      </span>
                      {member.name.toLowerCase() === searchQuery.toLowerCase() && (
                        <Check className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                    <span className="text-xs text-gray-500 truncate block">
                      {member.email}
                    </span>
                  </div>
                  
                  <div className="text-xs text-gray-400 capitalize">
                    {member.role}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-3 text-sm text-gray-500 text-center">
              <User className="h-4 w-4 mx-auto mb-1 text-gray-400" />
              No members found matching "{searchQuery}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}

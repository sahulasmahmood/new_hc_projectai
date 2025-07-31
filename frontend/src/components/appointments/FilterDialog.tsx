import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Filter, X } from "lucide-react";

export interface FilterValues {
  type: string[];
  timeRange: string;
}

export interface FilterDialogProps {
  onApplyFilters: (filters: FilterValues) => void;
  currentFilters: FilterValues;
  typeOptions: string[];
}

const FilterDialog = ({ onApplyFilters, currentFilters, typeOptions }: FilterDialogProps) => {
  const [open, setOpen] = useState(false);
  const [filters, setFilters] = useState<FilterValues>({
    type: currentFilters.type || [],
    timeRange: currentFilters.timeRange || "all"
  });

  const timeRangeOptions = [
    { value: "all", label: "All Day" },
    { value: "morning", label: "Morning (8AM - 12PM)" },
    { value: "afternoon", label: "Afternoon (12PM - 5PM)" },
    { value: "evening", label: "Evening (5PM - 8PM)" }
  ];

  const handleTypeChange = (type: string, checked: boolean) => {
    if (checked) {
      setFilters(prev => ({
        ...prev,
        type: [...prev.type, type]
      }));
    } else {
      setFilters(prev => ({
        ...prev,
        type: prev.type.filter((t: string) => t !== type)
      }));
    }
  };

  const handleApply = () => {
    onApplyFilters(filters);
    setOpen(false);
  };

  const handleClear = () => {
    const clearedFilters = { type: [], timeRange: "all" };
    setFilters(clearedFilters);
    onApplyFilters(clearedFilters);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Filter Appointments</DialogTitle>
          <DialogDescription className="sr-only">Filter appointments by type and time range.</DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <Label className="text-sm font-medium">Appointment Type</Label>
            <div className="grid grid-cols-2 gap-2">
              {typeOptions.map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={`type-${type}`}
                    checked={filters.type.includes(type)}
                    onCheckedChange={(checked) => handleTypeChange(type, checked as boolean)}
                  />
                  <Label htmlFor={`type-${type}`} className="text-sm font-normal">
                    {type}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">Time Range</Label>
            <Select value={filters.timeRange} onValueChange={(timeRange) => setFilters({...filters, timeRange})}>
              <SelectTrigger>
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent>
                {timeRangeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={handleClear}>
            <X className="h-4 w-4 mr-2" />
            Clear All
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleApply} className="bg-medical-500 hover:bg-medical-600">
              Apply Filters
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FilterDialog;

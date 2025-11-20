/**
 * PDF Parse Confirmation Modal
 * Shows parsed fields from PDF and allows user to accept or reject
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileText, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Info 
} from 'lucide-react';
import { ParsedField } from '@/services/pdfParserService';

interface PDFParseConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parsedFields: ParsedField[];
  unmappedData: string[];
  unknownFields?: Array<{
    label: string;
    value: string;
    rawText: string;
    unknown_field: true;
  }>;
  extractionMethod: 'text-extraction' | 'ocr';
  onAccept: () => void;
  onReject: () => void;
}

export function PDFParseConfirmationModal({
  open,
  onOpenChange,
  parsedFields,
  unmappedData,
  unknownFields = [],
  extractionMethod,
  onAccept,
  onReject,
}: PDFParseConfirmationModalProps) {
  const [selectedFields, setSelectedFields] = useState<Set<string>>(
    new Set(parsedFields.map(f => f.fieldName))
  );

  const toggleField = (fieldName: string) => {
    const newSelected = new Set(selectedFields);
    if (newSelected.has(fieldName)) {
      newSelected.delete(fieldName);
    } else {
      newSelected.add(fieldName);
    }
    setSelectedFields(newSelected);
  };

  const handleAccept = () => {
    // Filter to only include selected fields
    onAccept();
  };

  const handleReject = () => {
    setSelectedFields(new Set());
    onReject();
  };

  const getConfidenceBadge = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return <Badge variant="default" className="bg-green-500">High Confidence</Badge>;
      case 'medium':
        return <Badge variant="secondary">Medium Confidence</Badge>;
      case 'low':
        return <Badge variant="outline">Low Confidence</Badge>;
      default:
        return null;
    }
  };

  const getConfidenceIcon = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'medium':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'low':
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return null;
    }
  };

  const formatFieldName = (fieldName: string): string => {
    return fieldName
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatValue = (value: string | number | boolean): string => {
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    return String(value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Review Parsed PDF Data
          </DialogTitle>
          <DialogDescription>
            Review the information extracted from your PDF. Select the fields you want to use.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {/* Extraction Method Info */}
          <Alert className="mb-4">
            <Info className="h-4 w-4" />
            <AlertDescription>
              {extractionMethod === 'text-extraction' 
                ? 'Text was successfully extracted from your PDF.'
                : 'OCR was used to read your PDF. Please verify the accuracy of the extracted values.'}
            </AlertDescription>
          </Alert>

          <ScrollArea className="h-[400px] pr-4">
            {/* Parsed Fields */}
            {parsedFields.length > 0 ? (
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground mb-2">
                  Extracted Fields ({parsedFields.length})
                </h3>
                {parsedFields.map((field, index) => (
                  <div
                    key={`${field.fieldName}-${index}`}
                    className={`border rounded-lg p-3 transition-all ${
                      selectedFields.has(field.fieldName)
                        ? 'bg-primary/5 border-primary'
                        : 'bg-muted/30 border-muted'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2 flex-1">
                        <input
                          type="checkbox"
                          checked={selectedFields.has(field.fieldName)}
                          onChange={() => toggleField(field.fieldName)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {getConfidenceIcon(field.confidence)}
                            <span className="font-medium text-sm">
                              {formatFieldName(field.fieldName)}
                            </span>
                          </div>
                          <div className="text-lg font-semibold mb-1">
                            {formatValue(field.value)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Detected as: "{field.label}"
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {getConfidenceBadge(field.confidence)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Alert variant="destructive" className="mb-4">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  No recognizable fields were found in the PDF. You may need to enter the data manually.
                </AlertDescription>
              </Alert>
            )}

            {/* Unknown Fields - Strict Non-Hallucination */}
            {unknownFields.length > 0 && (
              <div className="mt-6 pt-6 border-t">
                <h3 className="font-semibold text-sm text-muted-foreground mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  Unknown Fields ({unknownFields.length} items)
                </h3>
                <Alert variant="destructive">
                  <AlertDescription>
                    <div className="text-xs space-y-1">
                      <p className="font-medium mb-2">
                        These fields were detected but are not in our mapping database:
                      </p>
                      {unknownFields.slice(0, 5).map((field, index) => (
                        <div key={index} className="text-sm">
                          <span className="font-medium">{field.label}:</span> {field.value}
                        </div>
                      ))}
                      {unknownFields.length > 5 && (
                        <div className="text-muted-foreground italic">
                          ... and {unknownFields.length - 5} more unknown fields
                        </div>
                      )}
                      <p className="mt-2 text-xs italic">
                        ⚠️ These fields will NOT be auto-filled to prevent incorrect mappings.
                      </p>
                    </div>
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {/* Unmapped Data */}
            {unmappedData.length > 0 && (
              <div className="mt-6 pt-6 border-t">
                <h3 className="font-semibold text-sm text-muted-foreground mb-2 flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Unrecognized Data ({unmappedData.length} items)
                </h3>
                <Alert>
                  <AlertDescription>
                    <div className="text-xs space-y-1">
                      <p className="font-medium mb-2">
                        The following information couldn't be automatically mapped:
                      </p>
                      {unmappedData.slice(0, 5).map((data, index) => (
                        <div key={index} className="text-muted-foreground truncate">
                          • {data}
                        </div>
                      ))}
                      {unmappedData.length > 5 && (
                        <div className="text-muted-foreground italic">
                          ... and {unmappedData.length - 5} more items
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </ScrollArea>
        </div>

        <DialogFooter className="flex-row gap-2 justify-end">
          <Button
            variant="outline"
            onClick={handleReject}
          >
            <XCircle className="h-4 w-4 mr-2" />
            Reject & Enter Manually
          </Button>
          <Button
            onClick={handleAccept}
            disabled={selectedFields.size === 0}
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Accept Selected Fields ({selectedFields.size})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default PDFParseConfirmationModal;

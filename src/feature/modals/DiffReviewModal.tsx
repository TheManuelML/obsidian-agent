import { App, Modal } from "obsidian";
import { createRoot, Root } from "react-dom/client";
import { ChangeObject, diffLines } from "diff";
import { useState, useMemo, useEffect } from "react";


function DiffReviewModalContent({
  oldContent,
  newContent,
  onConfirm,
  onCancel,
}: {
  oldContent: string,
  newContent: string,
  onConfirm: (finalContent: string, finalDiff: ChangeObject<string>[]) => void,
  onCancel: () => void,
}) {
  const initialDiff = diffLines(oldContent, newContent);
  
  // Group related changes together (removed + added pairs, or standalone changes)
  const groupedChanges = useMemo(() => {
    const groups: Array<{
      type: 'unchanged' | 'change';
      items: Array<{ change: ChangeObject<string>; index: number }>;
      groupId: number;
    }> = [];
    
    let groupId = 0;
    let i = 0;
    
    while (i < initialDiff.length) {
      const current = initialDiff[i];
      
      if (!current.added && !current.removed) {
        // Unchanged content - add as separate group
        groups.push({
          type: 'unchanged',
          items: [{ change: current, index: i }],
          groupId: -1, // Unchanged groups don't need IDs
        });
        i++;
      } else {
        // This is a change - check if next item is a related change
        const changeGroup: Array<{ change: ChangeObject<string>; index: number }> = [
          { change: current, index: i }
        ];
        
        // Look ahead to see if there's a related change (removed followed by added, or vice versa)
        if (i + 1 < initialDiff.length) {
          const next = initialDiff[i + 1];
          if (
            (current.removed && next.added) || 
            (current.added && next.removed)
          ) {
            // Group them together as a modification pair
            changeGroup.push({ change: next, index: i + 1 });
            i += 2;
          } else {
            i++;
          }
        } else {
          i++;
        }
        
        groups.push({
          type: 'change',
          items: changeGroup,
          groupId: groupId++,
        });
      }
    }
    
    return groups;
  }, [initialDiff]);
  
  // Track which change groups are accepted (groupId -> accepted)
  const [acceptedChanges, setAcceptedChanges] = useState<Map<number, boolean>>(new Map());
  
  // Initialize all change groups as accepted by default
  useEffect(() => {
    setAcceptedChanges(prev => {
      const updated = new Map(prev);
      let hasNew = false;
      groupedChanges.forEach(group => {
        if (group.type === 'change' && !updated.has(group.groupId)) {
          updated.set(group.groupId, true);
          hasNew = true;
        }
      });
      return hasNew ? updated : prev;
    });
  }, [groupedChanges]);

  const handleAcceptChange = (groupId: number) => {
    setAcceptedChanges(prev => {
      const updated = new Map(prev);
      updated.set(groupId, true);
      return updated;
    });
  };

  const handleDeclineChange = (groupId: number) => {
    setAcceptedChanges(prev => {
      const updated = new Map(prev);
      updated.set(groupId, false);
      return updated;
    });
  };

  const handleConfirm = () => {
    // Build final content with only accepted changes
    const acceptedContent = groupedChanges
      .map(group => {
        if (group.type === 'unchanged') {
          // Unchanged content: always include
          return group.items.map(item => item.change.value).join('');
        }
        
        // Change group: check if accepted
        const isAccepted = acceptedChanges.get(group.groupId) ?? true;
        
        if (isAccepted) {
          // Accepted: include added changes, exclude removed changes
          return group.items
            .filter(item => item.change.added)
            .map(item => item.change.value)
            .join('');
        } else {
          // Declined: exclude added changes, include removed changes (keep original)
          return group.items
            .filter(item => item.change.removed)
            .map(item => item.change.value)
            .join('');
        }
      })
      .join('');
    
    // Build diff with only accepted changes (both removed and added parts)
    const acceptedDiff = groupedChanges
      .filter(group => {
        if (group.type === 'unchanged') {
          return false; // Don't include unchanged in diff
        }
        // Only include accepted change groups
        return acceptedChanges.get(group.groupId) ?? true;
      })
      .flatMap(group => {
        // For accepted groups, show both removed and added changes
        return group.items.map(item => item.change);
      });
    
    // Log the accepted diff
    console.log('Accepted changes (diff):', {
      original: oldContent,
      final: acceptedContent,
      changes: acceptedDiff
    });
    
    // Log the final text separately
    console.log('Final text:', acceptedContent);
    
    onConfirm(acceptedContent, acceptedDiff);
  };

  return (
    <div className="obsidian-agent__diff-review-modal__container">
      <div className="obsidian-agent__diff-review-modal__diff-container">
        {groupedChanges.map((group, groupIndex) => {
          if (group.type === 'unchanged') {
            // Unchanged content - display normally
            return (
              <div key={`unchanged-${groupIndex}`} className="obsidian-agent__diff-review-modal__unchanged-content">
                {group.items.map(item => item.change.value).join('')}
              </div>
            );
          }
          
          // Changed content - display with buttons below
          const isAccepted = acceptedChanges.get(group.groupId) ?? true;
          
          return (
            <div key={`change-${group.groupId}`} className="obsidian-agent__diff-review-modal__change-container">
              {group.items.map((item, itemIndex) => {
                return (
                  <div 
                    key={`${group.groupId}-${itemIndex}`} 
                    className={`
                      obsidian-agent__diff-review-modal__change-content 
                      ${
                        item.change.added ? "obsidian-agent__diff-review-modal__change-content-added" :
                        item.change.removed ? "obsidian-agent__diff-review-modal__change-content-removed" :
                        "obsidian-agent__diff-review-modal__unchanged-content"
                      } 
                      ${isAccepted ? "" : "obsidian-agent__diff-review-modal__change-content-declined"}
                    `}>
                    {item.change.value}
                  </div>
                );
              })}
              <div className="obsidian-agent__diff-review-modal__changes-actions-container">
                <button
                  className="obsidian-agent__button-background"
                  onClick={() => handleDeclineChange(group.groupId)}
                  disabled={!isAccepted}
                >
                  Decline
                </button>
                <button
                  className="obsidian-agent__button-background obsidian-agent__button-background-primary"
                  onClick={() => handleAcceptChange(group.groupId)}
                  disabled={isAccepted}
                >
                  Accept
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <div className="obsidian-agent__diff-review-modal__confirmation-buttons-container">
        <button className="obsidian-agent__button-background" onClick={onCancel}>
          Cancel
        </button>
        
        <button className="obsidian-agent__button-background obsidian-agent__button-background-primary" onClick={handleConfirm}>
          Confirm changes
        </button>
      </div>
    </div>
  );
}

export class DiffReviewModal extends Modal {
  private root: Root | undefined;
  private onConfirm: (finalContent: string, finalDiff: ChangeObject<string>[]) => void;
  private oldContent: string;
  private newContent: string;
  
  public finalContent: string = "";
  public finalDiff: ChangeObject<string>[] = [];

  constructor(
    app: App,
    onConfirm: (finalContent: string, finalDiff: ChangeObject<string>[]) => void,
    oldContent: string,
    newContent: string,    
  ) {
    super(app);
    this.onConfirm = onConfirm;
    this.oldContent = oldContent;
    this.newContent = newContent;
    this.setTitle("Review changes");
  }

  onOpen() {
    const { contentEl } = this;
    this.root = createRoot(contentEl);
    
    this.modalEl.style.width = '60%';
    this.modalEl.style.maxWidth = '1200px';
    this.modalEl.style.height = '85%';
    this.modalEl.style.maxHeight = '800px';
    
    const handleConfirm = (finalContent: string, finalDiff: ChangeObject<string>[]) => {
      this.finalContent = finalContent;
      this.finalDiff = finalDiff;
      this.onConfirm(finalContent, finalDiff);
      this.close();
    };
    
    const handleCancel = () => {
      this.close();
    };

    this.root.render(
      <DiffReviewModalContent 
        oldContent={this.oldContent}
        newContent={this.newContent}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    );
  }

  onClose() {
    this.root?.unmount();
  }
}

'use strict';
// Dependency injection keeps recovery UI testable without opening host files or windows.
module.exports = function makeDraftModal({Modal,Notice,t}) {
  return class DraftModal extends Modal {
    constructor(app,plugin,key,fallback) { super(app); this.plugin=plugin;this.key=key;this.fallback=fallback; }
    onOpen() {
      this.titleEl.setText(t('drafts'));
      const draft=this.plugin.settings.recoveryDrafts[this.key];
      const json=draft ? draft.json : this.fallback || '';
      this.contentEl.createEl('p',{text:t('draftHint')});
      if(draft)this.contentEl.createEl('p',{text:draft.path});
      const field=this.contentEl.createEl('textarea',{cls:'mb-draft-text',attr:{readonly:'',rows:'14','aria-label':t('draft')}});
      field.value=json;
      const result=this.contentEl.createDiv({attr:{role:'status'}});
      const actions=this.contentEl.createDiv({cls:'dn-modal-foot'});
      actions.createEl('button',{text:t('copyDraft')}).onclick=async()=>{
        try { await field.ownerDocument.defaultView.navigator.clipboard.writeText(json);result.setText(t('copied')); }
        catch {result.setText(t('copyFailed'));field.focus();field.select();}
      };
      const save=actions.createEl('button',{text:t('saveDraft')});
      save.onclick=async()=>{
        save.disabled=true;
        try {
          const base='MB Calendar Recovery '+new Date().toISOString().replace(/[:.]/g,'-');
          let path=base+'.md',n=1;
          while(this.app.vault.getAbstractFileByPath(path))path=base+' '+(++n)+'.md';
          // User explicitly requested a separate recovery note. Keep the source note intact.
          const file=await this.app.vault.create(path,'```mb-calendar\n'+json+'\n```\n');
          result.setText(t('draftSaved'));
          await this.app.workspace.getLeaf(true).openFile(file);
        } catch {result.setText(t('saveFailed'));} finally {save.disabled=false;}
      };
      if(draft) {
        const discard=actions.createEl('button',{text:t('discardDraft')});
        discard.onclick=()=>{
          discard.disabled=true;
          const confirm=this.contentEl.createDiv();
          confirm.createEl('p',{text:t('discardConfirm')});
          confirm.createEl('button',{text:t('cancel')}).onclick=()=>{confirm.remove();discard.disabled=false;};
          confirm.createEl('button',{text:t('discardDraft'),cls:'mod-warning'}).onclick=async()=>{
            // Do not delete a newer draft that was captured while the confirmation was open.
            if(this.plugin.settings.recoveryDrafts[this.key]!==draft){result.setText(t('conflict'));return;}
            delete this.plugin.settings.recoveryDrafts[this.key];
            try {await this.plugin.saveSettings();this.close();} catch {this.plugin.settings.recoveryDrafts[this.key]=draft;new Notice(t('saveFailed'));}
          };
        };
      }
    }
    onClose(){this.contentEl.empty();}
  };
};

/* ═══════════════════════════════════════════════════
   KePolio — Dashboard Experiences
   ═══════════════════════════════════════════════════ */

(function () {
    'use strict';

    const { $ } = Dashboard;
    let editingExpId = null;

    function resetForm() {
        $('#expTitle').value = '';
        $('#expCompany').value = '';
        $('#expDuration').value = '';
        $('#expDesc').value = '';
        editingExpId = null;
        const addBtn = $('#addExpBtn');
        addBtn.innerHTML = 'Add Experience';
    }

    function cancelEdit() {
        resetForm();
    }

    Dashboard.loadExperiences = async function () {
        const exps = await DataService.getExperiences();
        const list = $('#expList');
        const limitNotice = $('#expsLimit');
        const addForm = $('#expsAddForm');

        if (exps.length >= 10) {
            limitNotice.style.display = 'block';
            addForm.style.display = 'none';
        } else {
            limitNotice.style.display = 'none';
            addForm.style.display = '';
        }

        if (exps.length === 0) {
            list.innerHTML = `
                <div class="empty-state">
                    <div style="font-size:40px;opacity:0.4">💼</div>
                    <div class="empty-state__text">No experiences added yet.</div>
                </div>
            `;
            setTimeout(() => $('#expTitle')?.focus(), 200);
            return;
        }

        list.innerHTML = exps.map(e => `
            <div class="exp-row" data-exp-id="${e.id}">
                <div class="exp-row__icon">💼</div>
                <div class="exp-row__info">
                    <div class="exp-row__title">${Utils.escapeHTML(e.title)}</div>
                    <div class="exp-row__company">${Utils.escapeHTML(e.company)}</div>
                    <div class="exp-row__meta">
                        ${e.duration ? `<span>${Utils.escapeHTML(e.duration)}</span>` : ''}
                    </div>
                    ${e.description ? `<div class="exp-row__desc">${Utils.escapeHTML(e.description)}</div>` : ''}
                </div>
                <div class="exp-row__actions">
                    <button class="btn btn--secondary btn--small" data-edit-exp="${e.id}" title="Edit">✏️ Edit</button>
                    <button class="btn btn--danger btn--small" data-delete-exp="${e.id}">Delete</button>
                </div>
            </div>
        `).join('');

        list.querySelectorAll('[data-edit-exp]').forEach(btn => {
            btn.addEventListener('click', () => {
                const exp = exps.find(e => e.id === btn.dataset.editExp);
                if (!exp) return;
                editingExpId = exp.id;
                $('#expTitle').value = exp.title;
                $('#expCompany').value = exp.company;
                $('#expDuration').value = exp.duration || '';
                $('#expDesc').value = exp.description || '';
                const addBtn = $('#addExpBtn');
                addBtn.innerHTML = 'Update Experience';
                addBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
                $('#expTitle').focus();
            });
        });

        Dashboard.attachInlineDelete({
            listEl: list,
            selector: 'delete-exp',
            rowClass: 'exp-row',
            deleteService: DataService.deleteExperience.bind(DataService),
            reloadFn: Dashboard.loadExperiences,
            toastLabel: 'Experience',
        });
    };

    Dashboard.initExperiences = function () {
        $('#addExpBtn')?.addEventListener('click', async () => {
            const addBtn = $('#addExpBtn');
            if (addBtn.disabled) return;

            const title = $('#expTitle').value.trim();
            const company = $('#expCompany').value.trim();
            const duration = $('#expDuration').value.trim();
            const description = $('#expDesc').value.trim();

            const errors = ValidationUtils.validateExperience({ title, company, duration, description });
            if (errors.length) {
                Utils.toast(errors[0], 'error');
                return;
            }

            addBtn.disabled = true;
            addBtn.innerHTML = '<span class="spinner"></span> ' + (editingExpId ? 'Updating...' : 'Adding...');

            try {
                if (editingExpId) {
                    await DataService.updateExperience(editingExpId, { title, company, duration, description });
                    Utils.toast('Experience updated', 'success');
                } else {
                    await DataService.addExperience({ title, company, duration, description });
                    Utils.toast('Experience added', 'success');
                }
                resetForm();
                await Dashboard.loadExperiences();
            } catch (err) {
                Utils.toast(err.message || 'Something went wrong', 'error');
            } finally {
                addBtn.disabled = false;
                addBtn.innerHTML = editingExpId ? 'Update Experience' : 'Add Experience';
            }
        });
    };
})();

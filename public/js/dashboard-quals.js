/* ═══════════════════════════════════════════════════
   KePolio — Dashboard Qualifications
   ═══════════════════════════════════════════════════ */

(function () {
    'use strict';

    const { $ } = Dashboard;
    let editingQualId = null;

    function resetForm() {
        $('#qualDegree').value = '';
        $('#qualInstitution').value = '';
        $('#qualYear').value = '';
        $('#qualGrade').value = '';
        editingQualId = null;
        const addBtn = $('#addQualBtn');
        addBtn.innerHTML = 'Add Qualification';
    }

    Dashboard.loadQualifications = async function () {
        const quals = await DataService.getQualifications();
        const list = $('#qualList');
        const limitNotice = $('#qualsLimit');
        const addForm = $('#qualsAddForm');

        if (quals.length >= 10) {
            limitNotice.style.display = 'block';
            addForm.style.display = 'none';
        } else {
            limitNotice.style.display = 'none';
            addForm.style.display = '';
        }

        if (quals.length === 0) {
            list.innerHTML = `
                <div class="empty-state">
                    <div style="font-size:40px;opacity:0.4">📚</div>
                    <div class="empty-state__text">No qualifications added yet.</div>
                </div>
            `;
            setTimeout(() => $('#qualDegree')?.focus(), 200);
            return;
        }

        list.innerHTML = quals.map(q => `
            <div class="qual-row" data-qual-id="${q.id}">
                <div class="qual-row__icon">🎓</div>
                <div class="qual-row__info">
                    <div class="qual-row__degree">${Utils.escapeHTML(q.degree)}</div>
                    <div class="qual-row__institution">${Utils.escapeHTML(q.institution)}</div>
                    <div class="qual-row__meta">
                        ${q.year ? `<span>${Utils.escapeHTML(q.year)}</span>` : ''}
                        ${q.grade ? `<span>· ${Utils.escapeHTML(q.grade)}</span>` : ''}
                    </div>
                </div>
                <div class="qual-row__actions">
                    <button class="btn btn--secondary btn--small" data-edit-qual="${q.id}" title="Edit">✏️ Edit</button>
                    <button class="btn btn--danger btn--small" data-delete-qual="${q.id}">Delete</button>
                </div>
            </div>
        `).join('');

        list.querySelectorAll('[data-edit-qual]').forEach(btn => {
            btn.addEventListener('click', () => {
                const qual = quals.find(q => q.id === btn.dataset.editQual);
                if (!qual) return;
                editingQualId = qual.id;
                $('#qualDegree').value = qual.degree;
                $('#qualInstitution').value = qual.institution;
                $('#qualYear').value = qual.year || '';
                $('#qualGrade').value = qual.grade || '';
                const addBtn = $('#addQualBtn');
                addBtn.innerHTML = 'Update Qualification';
                addBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
                $('#qualDegree').focus();
            });
        });

        Dashboard.attachInlineDelete({
            listEl: list,
            selector: 'delete-qual',
            rowClass: 'qual-row',
            deleteService: DataService.deleteQualification.bind(DataService),
            reloadFn: Dashboard.loadQualifications,
            toastLabel: 'Qualification',
        });
    };

    Dashboard.initQualifications = function () {
        $('#addQualBtn')?.addEventListener('click', async () => {
            const addBtn = $('#addQualBtn');
            if (addBtn.disabled) return;

            const degree = $('#qualDegree').value.trim();
            const institution = $('#qualInstitution').value.trim();
            const year = $('#qualYear').value.trim();
            const grade = $('#qualGrade').value.trim();

            const errors = ValidationUtils.validateQualification({ degree, institution, year, grade });
            if (errors.length) {
                Utils.toast(errors[0], 'error');
                return;
            }

            addBtn.disabled = true;
            addBtn.innerHTML = '<span class="spinner"></span> ' + (editingQualId ? 'Updating...' : 'Adding...');

            try {
                if (editingQualId) {
                    await DataService.updateQualification(editingQualId, { degree, institution, year, grade });
                    Utils.toast('Qualification updated', 'success');
                } else {
                    await DataService.addQualification({ degree, institution, year, grade });
                    Utils.toast('Qualification added', 'success');
                }
                resetForm();
                await Dashboard.loadQualifications();
            } catch (err) {
                Utils.toast(err.message || 'Something went wrong', 'error');
            } finally {
                addBtn.disabled = false;
                addBtn.innerHTML = editingQualId ? 'Update Qualification' : 'Add Qualification';
            }
        });
    };
})();

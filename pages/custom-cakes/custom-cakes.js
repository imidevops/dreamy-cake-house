/**
 * pages/custom-cakes/custom-cakes.js
 * Custom cake request form: occasion, size, flavor, design notes, budget,
 * reference image upload, delivery date.
 *
 * Functions:
 * - populateOptions(options) -> fills the occasion/size/flavor/budget
 *   <select> elements from data/custom-cakes.json, and sets the delivery
 *   date input's minimum to today + leadTimeDays.
 * - handleImagePreview(event) -> reads selected files with FileReader and
 *   renders thumbnails into #upload-preview (client-side only — there's no
 *   backend to actually upload to).
 * - validateForm(form) -> checks required fields + that the delivery date
 *   respects the lead time; marks invalid fields with `.invalid` and an
 *   inline error message. Returns true/false.
 * - handleSubmit(event) -> prevents default submission (no backend),
 *   validates, and shows a success message in #form-status.
 * - init() -> loads options JSON, wires up preview + submit handlers.
 *
 * Data source: /data/custom-cakes.json (via shared/utils.js#fetchJSON).
 */

let LEAD_TIME_DAYS = 7;

function populateOptions(options) {
  const occasionSelect = qs('#occasion');
  const sizeSelect = qs('#size');
  const flavorSelect = qs('#flavor');
  const budgetSelect = qs('#budget');
  const dateInput = qs('#delivery-date');
  const leadNote = qs('#lead-time-note');

  occasionSelect.innerHTML = '<option value="" disabled selected>Select an occasion</option>' +
    options.occasions.map(o => `<option value="${escapeHTML(o)}">${escapeHTML(o)}</option>`).join('');

  sizeSelect.innerHTML = '<option value="" disabled selected>Select a size</option>' +
    options.sizes.map(s => `<option value="${escapeHTML(s.value)}">${escapeHTML(s.label)}</option>`).join('');

  flavorSelect.innerHTML = '<option value="" disabled selected>Select a flavor</option>' +
    options.flavors.map(f => `<option value="${escapeHTML(f)}">${escapeHTML(f)}</option>`).join('');

  budgetSelect.innerHTML = '<option value="" disabled selected>Select a budget range</option>' +
    options.budgetRanges.map(b => `<option value="${escapeHTML(b)}">${escapeHTML(b)}</option>`).join('');

  LEAD_TIME_DAYS = options.leadTimeDays || 7;
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + LEAD_TIME_DAYS);
  dateInput.min = minDate.toISOString().split('T')[0];

  leadNote.textContent = options.leadTimeNote || '';
}

function handleImagePreview(event) {
  const preview = qs('#upload-preview');
  preview.innerHTML = '';
  const files = Array.from(event.target.files || []).slice(0, 4);
  files.forEach(file => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = document.createElement('img');
      img.src = reader.result;
      img.alt = file.name;
      preview.appendChild(img);
    };
    reader.readAsDataURL(file);
  });
}

function setFieldInvalid(field, message) {
  field.classList.add('invalid');
  const errorText = qs('.error-text', field);
  if (errorText) errorText.textContent = message;
}

function setFieldValid(field) {
  field.classList.remove('invalid');
}

function validateForm(form) {
  let isValid = true;
  const requiredIds = ['occasion', 'size', 'flavor', 'delivery-date', 'budget', 'name', 'contact'];

  requiredIds.forEach(id => {
    const input = qs(`#${id}`, form);
    const field = input.closest('.field');
    if (!input.value.trim()) {
      setFieldInvalid(field, 'This field is required.');
      isValid = false;
    } else {
      setFieldValid(field);
    }
  });

  const dateInput = qs('#delivery-date', form);
  const dateField = dateInput.closest('.field');
  if (dateInput.value && dateInput.min && dateInput.value < dateInput.min) {
    setFieldInvalid(dateField, `Please allow at least ${LEAD_TIME_DAYS} days' notice.`);
    isValid = false;
  }

  return isValid;
}

function handleSubmit(event) {
  event.preventDefault();
  const form = event.target;
  const status = qs('#form-status');

  if (!validateForm(form)) {
    status.className = 'form-status error';
    status.textContent = 'Please fix the highlighted fields and try again.';
    return;
  }

  // No backend yet — confirm receipt client-side only.
  status.className = 'form-status success';
  status.textContent = "Thanks! Your custom cake request has been received. We'll reach out shortly to confirm the details.";
  form.reset();
  qs('#upload-preview').innerHTML = '';
}

async function initCustomCakesPage() {
  const form = qs('#custom-cake-form');
  try {
    const options = await fetchJSON('data/custom-cakes.json');
    populateOptions(options);
  } catch {
    qs('#lead-time-note').textContent = 'Custom cakes need advance notice — details unavailable right now.';
  }

  qs('#design-images').addEventListener('change', handleImagePreview);
  form.addEventListener('submit', handleSubmit);
}

document.addEventListener('DOMContentLoaded', initCustomCakesPage);

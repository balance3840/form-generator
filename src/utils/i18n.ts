import { FormDocument, FormField, effectiveValidationType, flattenFields, isContainer, ruleSpecFor } from './schema';

/**
 * Multi language support.
 *
 * The content of a form (title, labels, options…) is written once, in the document's default language.
 * Other languages are stored as flat maps in `doc.i18n.translations[lang]`, keyed by a stable path such as
 * `field.<id>.label`. Anything that is not translated falls back to the default language, so a form is never blank.
 *
 *   i18n: {
 *     defaultLanguage: 'en',
 *     languages: ['en', 'es'],      // languages offered (the default is always included)
 *     detect: true,                 // pick the visitor's browser language when it is available
 *     switcher: 'flags',            // 'none' | 'flags' | 'dropdown': a language selector on the form
 *     translations: { es: { title: 'Contacto', 'field.name.label': 'Nombre' } }
 *   }
 *
 * The texts the generator itself shows (buttons, step counter, default error messages…) are built in for several
 * languages and can be overridden per language with `ui.<key>` / `validation.<key>` entries in `translations`.
 */

export type LanguageInfo = { code: string; name: string; flag: string; dir?: 'rtl' };

export const LANGUAGES: LanguageInfo[] = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'en-US', name: 'English (US)', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'ca', name: 'Català', flag: '' },
  { code: 'eu', name: 'Euskara', flag: '' },
  { code: 'gl', name: 'Galego', flag: '' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'pt-BR', name: 'Português (Brasil)', flag: '🇧🇷' },
  { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
  { code: 'pl', name: 'Polski', flag: '🇵🇱' },
  { code: 'cs', name: 'Čeština', flag: '🇨🇿' },
  { code: 'sk', name: 'Slovenčina', flag: '🇸🇰' },
  { code: 'hu', name: 'Magyar', flag: '🇭🇺' },
  { code: 'ro', name: 'Română', flag: '🇷🇴' },
  { code: 'bg', name: 'Български', flag: '🇧🇬' },
  { code: 'hr', name: 'Hrvatski', flag: '🇭🇷' },
  { code: 'sr', name: 'Srpski', flag: '🇷🇸' },
  { code: 'sl', name: 'Slovenščina', flag: '🇸🇮' },
  { code: 'el', name: 'Ελληνικά', flag: '🇬🇷' },
  { code: 'sv', name: 'Svenska', flag: '🇸🇪' },
  { code: 'da', name: 'Dansk', flag: '🇩🇰' },
  { code: 'no', name: 'Norsk', flag: '🇳🇴' },
  { code: 'fi', name: 'Suomi', flag: '🇫🇮' },
  { code: 'et', name: 'Eesti', flag: '🇪🇪' },
  { code: 'lv', name: 'Latviešu', flag: '🇱🇻' },
  { code: 'lt', name: 'Lietuvių', flag: '🇱🇹' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'uk', name: 'Українська', flag: '🇺🇦' },
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦', dir: 'rtl' },
  { code: 'he', name: 'עברית', flag: '🇮🇱', dir: 'rtl' },
  { code: 'fa', name: 'فارسی', flag: '🇮🇷', dir: 'rtl' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
  { code: 'bn', name: 'বাংলা', flag: '🇧🇩' },
  { code: 'th', name: 'ไทย', flag: '🇹🇭' },
  { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'id', name: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'ms', name: 'Bahasa Melayu', flag: '🇲🇾' },
  { code: 'zh', name: '中文 (简体)', flag: '🇨🇳' },
  { code: 'zh-TW', name: '中文 (繁體)', flag: '🇹🇼' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
];

export const languageInfo = (code: string): LanguageInfo => {
  const lower = (code || '').toLowerCase();
  return (
    LANGUAGES.find(l => l.code.toLowerCase() === lower) ||
    LANGUAGES.find(l => l.code.toLowerCase() === baseLanguage(lower)) || { code, name: code, flag: '' }
  );
};

export const baseLanguage = (code: string) => (code || '').toLowerCase().split(/[-_]/)[0];

/* ------------------------------------------------------------ built-in texts */

type Dict = { [key: string]: string };

const EN: Dict = {
  'ui.submit': 'Submit',
  'ui.continue': 'Continue',
  'ui.back': 'Back',
  'ui.sending': 'Sending…',
  'ui.submitAnother': 'Submit another response',
  'ui.step': 'Step {current} of {total}',
  'ui.success': 'Thank you! Your response has been recorded.',
  'ui.error': 'Something went wrong while submitting the form. Please try again.',
  'ui.formError': 'Please fix the highlighted fields',
  'ui.selectOption': 'Select an option',
  'ui.multiPlaceholder': 'Select…',
  'ui.selectedWord': 'selected',
  'ui.searchCountry': 'Search country',
  'ui.clickToUpload': 'Click to upload',
  'ui.orDragDrop': 'or drag and drop',
  'ui.anyFile': 'Any file',
  'ui.language': 'Language',
  'ui.ratingOf': '{n} of {max}',
  'validation.required': '{label} is required',
  'validation.minLength': '{label} must be at least {0} characters',
  'validation.maxLength': '{label} must be at most {0} characters',
  'validation.length': '{label} must be exactly {0}',
  'validation.email': 'Please enter a valid email address',
  'validation.url': 'Please enter a valid URL',
  'validation.uuid': '{label} must be a valid UUID',
  'validation.matches': '{label} is not in the right format',
  'validation.lowercase': '{label} must be lowercase',
  'validation.uppercase': '{label} must be uppercase',
  'validation.sameAs': '{label} must match {0}',
  'validation.notSameAs': '{label} must be different from {0}',
  'validation.oneOf': '{label} must be one of the allowed values',
  'validation.notOneOf': '{label} has a value that is not allowed',
  'validation.min': '{label} must be at least {0}',
  'validation.max': '{label} must be at most {0}',
  'validation.moreThan': '{label} must be greater than {0}',
  'validation.lessThan': '{label} must be less than {0}',
  'validation.integer': '{label} must be a whole number',
  'validation.positive': '{label} must be a positive number',
  'validation.negative': '{label} must be a negative number',
  'validation.minField': '{label} must be at least {0}',
  'validation.maxField': '{label} must be at most {0}',
  'validation.notBeforeField': '{label} must be on or after {0}',
  'validation.notAfterField': '{label} must be on or before {0}',
  'validation.minDate': '{label} must be on or after {0}',
  'validation.maxDate': '{label} must be on or before {0}',
  'validation.maxFileSize': 'Each file must be smaller than {0} MB',
  'validation.fileTypes': 'This file type is not allowed',
  'validation.minFiles': 'Upload at least {0} file(s)',
  'validation.maxFiles': 'Upload at most {0} file(s)',
  'validation.minChoices': 'Choose at least {0} option(s)',
  'validation.maxChoices': 'Choose at most {0} option(s)',
  'validation.captcha': 'Please confirm you are not a robot',
  // added later: appended at the end so the positional language tables below stay aligned
  'ui.other': 'Other',
  'ui.otherPlaceholder': 'Please specify',
  'ui.searching': 'Searching…',
  'ui.noResults': 'No results',
  'ui.searchFailed': 'Could not load results',
  'ui.remove': 'Remove',
};

// Keys are the same as EN; values are listed in the same order to keep this table easy to review.
const KEYS = Object.keys(EN);
const pack = (values: string[]): Dict => {
  const out: Dict = {};
  KEYS.forEach((key, i) => (out[key] = values[i]));
  return out;
};

const ES = pack([
  'Enviar', 'Continuar', 'Atrás', 'Enviando…', 'Enviar otra respuesta', 'Paso {current} de {total}', '¡Gracias! Hemos recibido tu respuesta.', 'Algo salió mal al enviar el formulario. Inténtalo de nuevo.', 'Corrige los campos marcados', 'Selecciona una opción', 'Selecciona…', 'seleccionados', 'Buscar país', 'Haz clic para subir', 'o arrastra y suelta', 'Cualquier archivo', 'Idioma', '{n} de {max}',
  '{label} es obligatorio', '{label} debe tener al menos {0} caracteres', '{label} debe tener como máximo {0} caracteres', '{label} debe tener exactamente {0}', 'Introduce un correo electrónico válido', 'Introduce una URL válida', '{label} debe ser un UUID válido', '{label} no tiene el formato correcto', '{label} debe estar en minúsculas', '{label} debe estar en mayúsculas', '{label} debe coincidir con {0}', '{label} debe ser distinto de {0}', '{label} debe ser uno de los valores permitidos', '{label} tiene un valor no permitido', '{label} debe ser al menos {0}', '{label} debe ser como máximo {0}', '{label} debe ser mayor que {0}', '{label} debe ser menor que {0}', '{label} debe ser un número entero', '{label} debe ser un número positivo', '{label} debe ser un número negativo', '{label} debe ser al menos {0}', '{label} debe ser como máximo {0}', '{label} no puede ser anterior a {0}', '{label} no puede ser posterior a {0}', '{label} no puede ser anterior al {0}', '{label} no puede ser posterior al {0}', 'Cada archivo debe pesar menos de {0} MB', 'Este tipo de archivo no está permitido', 'Sube al menos {0} archivo(s)', 'Sube como máximo {0} archivo(s)', 'Elige al menos {0} opción(es)', 'Elige como máximo {0} opción(es)', 'Confirma que no eres un robot',
  'Otro', 'Especifica',
  'Buscando…', 'Sin resultados', 'No se pudieron cargar los resultados', 'Quitar',
]);

const FR = pack([
  'Envoyer', 'Continuer', 'Retour', 'Envoi…', 'Envoyer une autre réponse', 'Étape {current} sur {total}', 'Merci ! Votre réponse a bien été enregistrée.', "Une erreur est survenue lors de l'envoi du formulaire. Veuillez réessayer.", 'Veuillez corriger les champs signalés', 'Sélectionnez une option', 'Sélectionner…', 'sélectionnés', 'Rechercher un pays', 'Cliquez pour téléverser', 'ou glissez-déposez', 'Tout fichier', 'Langue', '{n} sur {max}',
  '{label} est obligatoire', '{label} doit contenir au moins {0} caractères', '{label} doit contenir au plus {0} caractères', '{label} doit contenir exactement {0}', 'Saisissez une adresse e-mail valide', 'Saisissez une URL valide', '{label} doit être un UUID valide', "{label} n'a pas le bon format", '{label} doit être en minuscules', '{label} doit être en majuscules', '{label} doit correspondre à {0}', '{label} doit être différent de {0}', "{label} doit être l'une des valeurs autorisées", '{label} contient une valeur non autorisée', '{label} doit être au moins {0}', '{label} doit être au plus {0}', '{label} doit être supérieur à {0}', '{label} doit être inférieur à {0}', '{label} doit être un nombre entier', '{label} doit être un nombre positif', '{label} doit être un nombre négatif', '{label} doit être au moins {0}', '{label} doit être au plus {0}', '{label} ne peut pas être antérieur à {0}', '{label} ne peut pas être postérieur à {0}', '{label} ne peut pas être antérieur au {0}', '{label} ne peut pas être postérieur au {0}', 'Chaque fichier doit faire moins de {0} Mo', "Ce type de fichier n'est pas autorisé", 'Téléversez au moins {0} fichier(s)', 'Téléversez au plus {0} fichier(s)', 'Choisissez au moins {0} option(s)', 'Choisissez au plus {0} option(s)', "Confirmez que vous n'êtes pas un robot",
  'Autre', 'Précisez',
  'Recherche…', 'Aucun résultat', 'Impossible de charger les résultats', 'Retirer',
]);

const DE = pack([
  'Absenden', 'Weiter', 'Zurück', 'Wird gesendet…', 'Weitere Antwort senden', 'Schritt {current} von {total}', 'Danke! Deine Antwort wurde gespeichert.', 'Beim Senden des Formulars ist ein Fehler aufgetreten. Bitte versuche es erneut.', 'Bitte korrigiere die markierten Felder', 'Option auswählen', 'Auswählen…', 'ausgewählt', 'Land suchen', 'Zum Hochladen klicken', 'oder per Drag & Drop', 'Beliebige Datei', 'Sprache', '{n} von {max}',
  '{label} ist erforderlich', '{label} muss mindestens {0} Zeichen lang sein', '{label} darf höchstens {0} Zeichen lang sein', '{label} muss genau {0} lang sein', 'Bitte gib eine gültige E-Mail-Adresse ein', 'Bitte gib eine gültige URL ein', '{label} muss eine gültige UUID sein', '{label} hat nicht das richtige Format', '{label} muss kleingeschrieben sein', '{label} muss großgeschrieben sein', '{label} muss mit {0} übereinstimmen', '{label} muss sich von {0} unterscheiden', '{label} muss einer der erlaubten Werte sein', '{label} enthält einen nicht erlaubten Wert', '{label} muss mindestens {0} sein', '{label} darf höchstens {0} sein', '{label} muss größer als {0} sein', '{label} muss kleiner als {0} sein', '{label} muss eine ganze Zahl sein', '{label} muss eine positive Zahl sein', '{label} muss eine negative Zahl sein', '{label} muss mindestens {0} sein', '{label} darf höchstens {0} sein', '{label} darf nicht vor {0} liegen', '{label} darf nicht nach {0} liegen', '{label} darf nicht vor dem {0} liegen', '{label} darf nicht nach dem {0} liegen', 'Jede Datei muss kleiner als {0} MB sein', 'Dieser Dateityp ist nicht erlaubt', 'Lade mindestens {0} Datei(en) hoch', 'Lade höchstens {0} Datei(en) hoch', 'Wähle mindestens {0} Option(en)', 'Wähle höchstens {0} Option(en)', 'Bitte bestätige, dass du kein Roboter bist',
  'Sonstiges', 'Bitte angeben',
  'Suche läuft…', 'Keine Ergebnisse', 'Ergebnisse konnten nicht geladen werden', 'Entfernen',
]);

const IT = pack([
  'Invia', 'Continua', 'Indietro', 'Invio in corso…', "Invia un'altra risposta", 'Passaggio {current} di {total}', 'Grazie! La tua risposta è stata registrata.', "Si è verificato un errore durante l'invio del modulo. Riprova.", 'Correggi i campi evidenziati', "Seleziona un'opzione", 'Seleziona…', 'selezionati', 'Cerca paese', 'Clicca per caricare', 'o trascina qui', 'Qualsiasi file', 'Lingua', '{n} su {max}',
  '{label} è obbligatorio', '{label} deve contenere almeno {0} caratteri', '{label} deve contenere al massimo {0} caratteri', '{label} deve essere esattamente {0}', 'Inserisci un indirizzo email valido', 'Inserisci un URL valido', '{label} deve essere un UUID valido', '{label} non ha il formato corretto', '{label} deve essere in minuscolo', '{label} deve essere in maiuscolo', '{label} deve corrispondere a {0}', '{label} deve essere diverso da {0}', '{label} deve essere uno dei valori consentiti', '{label} contiene un valore non consentito', '{label} deve essere almeno {0}', '{label} deve essere al massimo {0}', '{label} deve essere maggiore di {0}', '{label} deve essere minore di {0}', '{label} deve essere un numero intero', '{label} deve essere un numero positivo', '{label} deve essere un numero negativo', '{label} deve essere almeno {0}', '{label} deve essere al massimo {0}', '{label} non può essere precedente a {0}', '{label} non può essere successivo a {0}', '{label} non può essere precedente al {0}', '{label} non può essere successivo al {0}', 'Ogni file deve pesare meno di {0} MB', 'Questo tipo di file non è consentito', 'Carica almeno {0} file', 'Carica al massimo {0} file', 'Scegli almeno {0} opzione/i', 'Scegli al massimo {0} opzione/i', 'Conferma di non essere un robot',
  'Altro', 'Specifica',
  'Ricerca in corso…', 'Nessun risultato', 'Impossibile caricare i risultati', 'Rimuovi',
]);

const PT = pack([
  'Enviar', 'Continuar', 'Voltar', 'Enviando…', 'Enviar outra resposta', 'Etapa {current} de {total}', 'Obrigado! Sua resposta foi registrada.', 'Algo deu errado ao enviar o formulário. Tente novamente.', 'Corrija os campos destacados', 'Selecione uma opção', 'Selecione…', 'selecionados', 'Buscar país', 'Clique para enviar', 'ou arraste e solte', 'Qualquer arquivo', 'Idioma', '{n} de {max}',
  '{label} é obrigatório', '{label} deve ter pelo menos {0} caracteres', '{label} deve ter no máximo {0} caracteres', '{label} deve ter exatamente {0}', 'Informe um e-mail válido', 'Informe uma URL válida', '{label} deve ser um UUID válido', '{label} não está no formato correto', '{label} deve estar em minúsculas', '{label} deve estar em maiúsculas', '{label} deve ser igual a {0}', '{label} deve ser diferente de {0}', '{label} deve ser um dos valores permitidos', '{label} tem um valor não permitido', '{label} deve ser pelo menos {0}', '{label} deve ser no máximo {0}', '{label} deve ser maior que {0}', '{label} deve ser menor que {0}', '{label} deve ser um número inteiro', '{label} deve ser um número positivo', '{label} deve ser um número negativo', '{label} deve ser pelo menos {0}', '{label} deve ser no máximo {0}', '{label} não pode ser anterior a {0}', '{label} não pode ser posterior a {0}', '{label} não pode ser anterior a {0}', '{label} não pode ser posterior a {0}', 'Cada arquivo deve ter menos de {0} MB', 'Este tipo de arquivo não é permitido', 'Envie pelo menos {0} arquivo(s)', 'Envie no máximo {0} arquivo(s)', 'Escolha pelo menos {0} opção(ões)', 'Escolha no máximo {0} opção(ões)', 'Confirme que você não é um robô',
  'Outro', 'Especifique',
  'Pesquisando…', 'Nenhum resultado', 'Não foi possível carregar os resultados', 'Remover',
]);

const NL = pack([
  'Verzenden', 'Doorgaan', 'Terug', 'Verzenden…', 'Nog een antwoord verzenden', 'Stap {current} van {total}', 'Bedankt! Je antwoord is opgeslagen.', 'Er is iets misgegaan bij het verzenden van het formulier. Probeer het opnieuw.', 'Corrigeer de gemarkeerde velden', 'Kies een optie', 'Selecteren…', 'geselecteerd', 'Zoek een land', 'Klik om te uploaden', 'of sleep een bestand hierheen', 'Elk bestand', 'Taal', '{n} van {max}',
  '{label} is verplicht', '{label} moet minstens {0} tekens bevatten', '{label} mag maximaal {0} tekens bevatten', '{label} moet precies {0} zijn', 'Voer een geldig e-mailadres in', 'Voer een geldige URL in', '{label} moet een geldige UUID zijn', '{label} heeft niet het juiste formaat', '{label} moet in kleine letters zijn', '{label} moet in hoofdletters zijn', '{label} moet overeenkomen met {0}', '{label} moet verschillen van {0}', '{label} moet een van de toegestane waarden zijn', '{label} bevat een niet-toegestane waarde', '{label} moet minstens {0} zijn', '{label} mag maximaal {0} zijn', '{label} moet groter zijn dan {0}', '{label} moet kleiner zijn dan {0}', '{label} moet een geheel getal zijn', '{label} moet een positief getal zijn', '{label} moet een negatief getal zijn', '{label} moet minstens {0} zijn', '{label} mag maximaal {0} zijn', '{label} mag niet vóór {0} liggen', '{label} mag niet na {0} liggen', '{label} mag niet vóór {0} liggen', '{label} mag niet na {0} liggen', 'Elk bestand moet kleiner zijn dan {0} MB', 'Dit bestandstype is niet toegestaan', 'Upload minstens {0} bestand(en)', 'Upload maximaal {0} bestand(en)', 'Kies minstens {0} optie(s)', 'Kies maximaal {0} optie(s)', 'Bevestig dat je geen robot bent',
  'Anders', 'Specificeer',
  'Zoeken…', 'Geen resultaten', 'Resultaten konden niet worden geladen', 'Verwijderen',
]);

const PL = pack([
  'Wyślij', 'Dalej', 'Wstecz', 'Wysyłanie…', 'Wyślij kolejną odpowiedź', 'Krok {current} z {total}', 'Dziękujemy! Twoja odpowiedź została zapisana.', 'Podczas wysyłania formularza wystąpił błąd. Spróbuj ponownie.', 'Popraw zaznaczone pola', 'Wybierz opcję', 'Wybierz…', 'wybrano', 'Szukaj kraju', 'Kliknij, aby przesłać', 'lub przeciągnij i upuść', 'Dowolny plik', 'Język', '{n} z {max}',
  'Pole {label} jest wymagane', '{label}: minimalna długość to {0} znaków', '{label}: maksymalna długość to {0} znaków', '{label}: wymagana długość to {0}', 'Podaj poprawny adres e-mail', 'Podaj poprawny adres URL', '{label} musi być poprawnym UUID', '{label} ma nieprawidłowy format', '{label} musi być zapisane małymi literami', '{label} musi być zapisane wielkimi literami', '{label} musi być takie samo jak {0}', '{label} musi różnić się od {0}', '{label} musi być jedną z dozwolonych wartości', '{label} zawiera niedozwoloną wartość', '{label} musi wynosić co najmniej {0}', '{label} może wynosić najwyżej {0}', '{label} musi być większe niż {0}', '{label} musi być mniejsze niż {0}', '{label} musi być liczbą całkowitą', '{label} musi być liczbą dodatnią', '{label} musi być liczbą ujemną', '{label} musi wynosić co najmniej {0}', '{label} może wynosić najwyżej {0}', '{label} nie może być wcześniejsze niż {0}', '{label} nie może być późniejsze niż {0}', '{label} nie może być wcześniejsze niż {0}', '{label} nie może być późniejsze niż {0}', 'Każdy plik musi być mniejszy niż {0} MB', 'Ten typ pliku jest niedozwolony', 'Prześlij co najmniej {0} plik(ów)', 'Prześlij najwyżej {0} plik(ów)', 'Wybierz co najmniej {0} opcji', 'Wybierz najwyżej {0} opcji', 'Potwierdź, że nie jesteś robotem',
  'Inne', 'Podaj jakie',
  'Wyszukiwanie…', 'Brak wyników', 'Nie udało się wczytać wyników', 'Usuń',
]);

const CA = pack([
  'Envia', 'Continua', 'Enrere', 'Enviant…', 'Envia una altra resposta', 'Pas {current} de {total}', 'Gràcies! Hem rebut la teva resposta.', 'Alguna cosa ha anat malament en enviar el formulari. Torna-ho a provar.', 'Corregeix els camps marcats', 'Selecciona una opció', 'Selecciona…', 'seleccionats', 'Cerca un país', 'Fes clic per pujar', 'o arrossega i deixa anar', 'Qualsevol fitxer', 'Idioma', '{n} de {max}',
  '{label} és obligatori', '{label} ha de tenir almenys {0} caràcters', '{label} ha de tenir com a màxim {0} caràcters', '{label} ha de tenir exactament {0}', 'Introdueix un correu electrònic vàlid', 'Introdueix una URL vàlida', '{label} ha de ser un UUID vàlid', '{label} no té el format correcte', "{label} ha d'estar en minúscules", "{label} ha d'estar en majúscules", '{label} ha de coincidir amb {0}', '{label} ha de ser diferent de {0}', '{label} ha de ser un dels valors permesos', '{label} té un valor no permès', '{label} ha de ser com a mínim {0}', '{label} ha de ser com a màxim {0}', '{label} ha de ser més gran que {0}', '{label} ha de ser més petit que {0}', '{label} ha de ser un nombre enter', '{label} ha de ser un nombre positiu', '{label} ha de ser un nombre negatiu', '{label} ha de ser com a mínim {0}', '{label} ha de ser com a màxim {0}', '{label} no pot ser anterior a {0}', '{label} no pot ser posterior a {0}', '{label} no pot ser anterior a {0}', '{label} no pot ser posterior a {0}', 'Cada fitxer ha de pesar menys de {0} MB', 'Aquest tipus de fitxer no està permès', 'Puja almenys {0} fitxer(s)', 'Puja com a màxim {0} fitxer(s)', 'Tria almenys {0} opció(ns)', 'Tria com a màxim {0} opció(ns)', 'Confirma que no ets un robot',
  'Altre', 'Especifica',
  'Cercant…', 'Cap resultat', "No s'han pogut carregar els resultats", 'Treu',
]);

const DA = pack([
  "Send",
  "Fortsæt",
  "Tilbage",
  "Sender…",
  "Send et nyt svar",
  "Trin {current} af {total}",
  "Tak! Dit svar er modtaget.",
  "Noget gik galt, da formularen skulle sendes. Prøv igen.",
  "Ret de markerede felter",
  "Vælg en mulighed",
  "Vælg…",
  "valgt",
  "Søg efter land",
  "Klik for at uploade",
  "eller træk og slip",
  "Alle filtyper",
  "Sprog",
  "{n} af {max}",
  "{label} er påkrævet",
  "{label} skal være mindst {0} tegn",
  "{label} må højst være {0} tegn",
  "{label} skal være præcis {0}",
  "Indtast en gyldig e-mailadresse",
  "Indtast en gyldig URL",
  "{label} skal være et gyldigt UUID",
  "{label} har ikke det rigtige format",
  "{label} skal skrives med små bogstaver",
  "{label} skal skrives med store bogstaver",
  "{label} skal stemme overens med {0}",
  "{label} skal være forskellig fra {0}",
  "{label} skal være en af de tilladte værdier",
  "{label} indeholder en værdi, der ikke er tilladt",
  "{label} skal være mindst {0}",
  "{label} må højst være {0}",
  "{label} skal være større end {0}",
  "{label} skal være mindre end {0}",
  "{label} skal være et helt tal",
  "{label} skal være et positivt tal",
  "{label} skal være et negativt tal",
  "{label} skal være mindst {0}",
  "{label} må højst være {0}",
  "{label} må ikke ligge før {0}",
  "{label} må ikke ligge efter {0}",
  "{label} må ikke ligge før {0}",
  "{label} må ikke ligge efter {0}",
  "Hver fil skal være mindre end {0} MB",
  "Denne filtype er ikke tilladt",
  "Upload mindst {0} fil(er)",
  "Upload højst {0} fil(er)",
  "Vælg mindst {0} mulighed(er)",
  "Vælg højst {0} mulighed(er)",
  "Bekræft, at du ikke er en robot",
  "Andet",
  "Angiv venligst",
  "Søger…",
  "Ingen resultater",
  "Resultaterne kunne ikke indlæses",
  "Fjern",
]);

// Texts added after the positional tables above. These are written per language with explicit keys, so adding more never shifts anything.
const EXTRA_KEYS = ['ui.itemTitle', 'ui.addItem', 'ui.noItems', 'ui.saveExit', 'ui.savedAt', 'ui.signHere', 'ui.clearSignature', 'ui.stepsNav', 'ui.done', 'ui.showFirstError', 'validation.minItems', 'validation.maxItems', 'ui.cancel', 'ui.confirm', 'ui.save', 'ui.close', 'ui.edit', 'ui.duplicate', 'ui.moveUp', 'ui.moveDown', 'ui.itemOptions', 'ui.dragToReorder', 'ui.sign', 'ui.type', 'ui.search', 'ui.selectedCount'];
const extra = (values: string[]): Dict => {
  const out: Dict = {};
  EXTRA_KEYS.forEach((key, i) => (out[key] = values[i]));
  return out;
};
const EXTRA: { [language: string]: Dict } = {
  en: extra(['Item {n}', 'Add', 'Nothing added yet', 'Save and exit', 'Saved at {time}', 'Sign here', 'Clear', 'Steps', 'Done', 'Show the first one', '{label}: add at least {0}', '{label}: add at most {0}', 'Cancel', 'Confirm', 'Save', 'Close', 'Edit', 'Duplicate', 'Move up', 'Move down', 'Options', 'Drag to reorder', 'Sign', 'Type', 'Search', '{n} selected']),
  es: extra(['Elemento {n}', 'Añadir', 'Todavía no se ha añadido nada', 'Guardar y salir', 'Guardado a las {time}', 'Firma aquí', 'Borrar', 'Pasos', 'Hecho', 'Mostrar el primero', '{label}: añade al menos {0}', '{label}: añade como máximo {0}', 'Cancelar', 'Confirmar', 'Guardar', 'Cerrar', 'Editar', 'Duplicar', 'Subir', 'Bajar', 'Opciones', 'Arrastra para reordenar', 'Firmar', 'Tipo', 'Buscar', '{n} seleccionados']),
  fr: extra(['Élément {n}', 'Ajouter', 'Rien n’a encore été ajouté', 'Enregistrer et quitter', 'Enregistré à {time}', 'Signez ici', 'Effacer', 'Étapes', 'Terminé', 'Afficher le premier', '{label} : ajoutez-en au moins {0}', '{label} : ajoutez-en au plus {0}', 'Annuler', 'Confirmer', 'Enregistrer', 'Fermer', 'Modifier', 'Dupliquer', 'Monter', 'Descendre', 'Options', 'Glisser pour réorganiser', 'Signer', 'Type', 'Rechercher', '{n} sélectionnés']),
  de: extra(['Eintrag {n}', 'Hinzufügen', 'Noch nichts hinzugefügt', 'Speichern und beenden', 'Gespeichert um {time}', 'Hier unterschreiben', 'Löschen', 'Schritte', 'Fertig', 'Zum ersten springen', '{label}: mindestens {0} hinzufügen', '{label}: höchstens {0} hinzufügen', 'Abbrechen', 'Bestätigen', 'Speichern', 'Schließen', 'Bearbeiten', 'Duplizieren', 'Nach oben', 'Nach unten', 'Optionen', 'Zum Sortieren ziehen', 'Unterschreiben', 'Typ', 'Suchen', '{n} ausgewählt']),
  it: extra(['Elemento {n}', 'Aggiungi', 'Ancora nulla di aggiunto', 'Salva ed esci', 'Salvato alle {time}', 'Firma qui', 'Cancella', 'Passaggi', 'Fatto', 'Vai al primo', '{label}: aggiungi almeno {0}', '{label}: aggiungi al massimo {0}', 'Annulla', 'Conferma', 'Salva', 'Chiudi', 'Modifica', 'Duplica', 'Sposta su', 'Sposta giù', 'Opzioni', 'Trascina per riordinare', 'Firma', 'Tipo', 'Cerca', '{n} selezionati']),
  pt: extra(['Item {n}', 'Adicionar', 'Ainda não foi adicionado nada', 'Guardar e sair', 'Guardado às {time}', 'Assine aqui', 'Limpar', 'Passos', 'Concluído', 'Mostrar o primeiro', '{label}: adicione pelo menos {0}', '{label}: adicione no máximo {0}', 'Cancelar', 'Confirmar', 'Guardar', 'Fechar', 'Editar', 'Duplicar', 'Subir', 'Descer', 'Opções', 'Arraste para reordenar', 'Assinar', 'Tipo', 'Pesquisar', '{n} selecionados']),
  nl: extra(['Item {n}', 'Toevoegen', 'Nog niets toegevoegd', 'Opslaan en afsluiten', 'Opgeslagen om {time}', 'Teken hier uw handtekening', 'Wissen', 'Stappen', 'Klaar', 'Toon de eerste', '{label}: voeg er minimaal {0} toe', '{label}: voeg er maximaal {0} toe', 'Annuleren', 'Bevestigen', 'Opslaan', 'Sluiten', 'Bewerken', 'Dupliceren', 'Omhoog', 'Omlaag', 'Opties', 'Sleep om te ordenen', 'Ondertekenen', 'Type', 'Zoeken', '{n} geselecteerd']),
  pl: extra(['Pozycja {n}', 'Dodaj', 'Nic jeszcze nie dodano', 'Zapisz i wyjdź', 'Zapisano o {time}', 'Podpisz tutaj', 'Wyczyść', 'Kroki', 'Gotowe', 'Pokaż pierwszy', '{label}: dodaj co najmniej {0}', '{label}: dodaj najwyżej {0}', 'Anuluj', 'Potwierdź', 'Zapisz', 'Zamknij', 'Edytuj', 'Duplikuj', 'W górę', 'W dół', 'Opcje', 'Przeciągnij, aby zmienić kolejność', 'Podpisz', 'Typ', 'Szukaj', 'Wybrano: {n}']),
  ca: extra(['Element {n}', 'Afegeix', 'Encara no s’ha afegit res', 'Desa i surt', 'Desat a les {time}', 'Signa aquí', 'Esborra', 'Passos', 'Fet', 'Mostra el primer', '{label}: afegeix-ne almenys {0}', '{label}: afegeix-ne com a màxim {0}', 'Cancel·la', 'Confirma', 'Desa', 'Tanca', 'Edita', 'Duplica', 'Mou amunt', 'Mou avall', 'Opcions', 'Arrossega per reordenar', 'Signa', 'Tipus', 'Cerca', '{n} seleccionats']),
  da: extra(['Element {n}', 'Tilføj', 'Intet tilføjet endnu', 'Gem og afslut', 'Gemt kl. {time}', 'Underskriv her', 'Ryd', 'Trin', 'Færdig', 'Vis den første', '{label}: tilføj mindst {0}', '{label}: tilføj højst {0}', 'Annuller', 'Bekræft', 'Gem', 'Luk', 'Rediger', 'Dupliker', 'Flyt op', 'Flyt ned', 'Indstillinger', 'Træk for at sortere', 'Underskriv', 'Type', 'Søg', '{n} valgt']),
};

// Texts for the phone, Likert and ranking fields, written with explicit keys per language.
const MORE: { [language: string]: Dict } = {
  en: { 'ui.prevMonth': 'Previous month', 'ui.nextMonth': 'Next month', 'ui.pickFirstDay': 'Pick the first day', 'ui.pickLastDay': 'Pick the last day', 'ui.daysCount': '{n} days', 'validation.pickTimes': 'Choose a time for every day', 'ui.yes': 'Yes', 'ui.no': 'No', 'ui.rankHint': 'Click the options in order of preference', 'ui.rankReset': 'Start over', 'ui.countryCode': 'Country code', 'validation.phone': 'Please enter a valid phone number', 'validation.phoneCountries': 'Phone numbers from this country are not accepted', 'validation.emailDomains': 'Please use an e-mail address from an allowed domain', 'validation.likertAll': 'Please answer every statement', 'validation.rankAll': 'Please rank all the options', 'validation.rankTop': 'Please pick your top {0}' },
  es: { 'ui.prevMonth': 'Mes anterior', 'ui.nextMonth': 'Mes siguiente', 'ui.pickFirstDay': 'Elige el primer día', 'ui.pickLastDay': 'Elige el último día', 'ui.daysCount': '{n} días', 'validation.pickTimes': 'Elige una hora para cada día', 'ui.yes': 'Sí', 'ui.no': 'No', 'ui.rankHint': 'Haz clic en las opciones por orden de preferencia', 'ui.rankReset': 'Empezar de nuevo', 'ui.countryCode': 'Prefijo del país', 'validation.phone': 'Introduce un número de teléfono válido', 'validation.phoneCountries': 'No se aceptan teléfonos de este país', 'validation.emailDomains': 'Usa un correo electrónico de un dominio permitido', 'validation.likertAll': 'Responde a todas las afirmaciones', 'validation.rankAll': 'Ordena todas las opciones', 'validation.rankTop': 'Elige tus {0} favoritas' },
  fr: { 'ui.prevMonth': 'Mois précédent', 'ui.nextMonth': 'Mois suivant', 'ui.pickFirstDay': 'Choisissez le premier jour', 'ui.pickLastDay': 'Choisissez le dernier jour', 'ui.daysCount': '{n} jours', 'validation.pickTimes': 'Choisissez un horaire pour chaque jour', 'ui.yes': 'Oui', 'ui.no': 'Non', 'ui.rankHint': 'Cliquez sur les options par ordre de préférence', 'ui.rankReset': 'Recommencer', 'ui.countryCode': 'Indicatif du pays', 'validation.phone': 'Saisissez un numéro de téléphone valide', 'validation.phoneCountries': 'Les numéros de ce pays ne sont pas acceptés', 'validation.emailDomains': 'Utilisez une adresse e-mail d’un domaine autorisé', 'validation.likertAll': 'Répondez à chaque affirmation', 'validation.rankAll': 'Classez toutes les options', 'validation.rankTop': 'Choisissez vos {0} préférées' },
  de: { 'ui.prevMonth': 'Vorheriger Monat', 'ui.nextMonth': 'Nächster Monat', 'ui.pickFirstDay': 'Wählen Sie den ersten Tag', 'ui.pickLastDay': 'Wählen Sie den letzten Tag', 'ui.daysCount': '{n} Tage', 'validation.pickTimes': 'Bitte wählen Sie für jeden Tag eine Zeit', 'ui.yes': 'Ja', 'ui.no': 'Nein', 'ui.rankHint': 'Klicken Sie die Optionen in der Reihenfolge Ihrer Präferenz an', 'ui.rankReset': 'Neu beginnen', 'ui.countryCode': 'Ländervorwahl', 'validation.phone': 'Bitte geben Sie eine gültige Telefonnummer ein', 'validation.phoneCountries': 'Telefonnummern aus diesem Land werden nicht akzeptiert', 'validation.emailDomains': 'Bitte verwenden Sie eine E-Mail-Adresse einer erlaubten Domain', 'validation.likertAll': 'Bitte beantworten Sie jede Aussage', 'validation.rankAll': 'Bitte ordnen Sie alle Optionen', 'validation.rankTop': 'Bitte wählen Sie Ihre Top {0}' },
  it: { 'ui.prevMonth': 'Mese precedente', 'ui.nextMonth': 'Mese successivo', 'ui.pickFirstDay': 'Scegli il primo giorno', 'ui.pickLastDay': 'Scegli l’ultimo giorno', 'ui.daysCount': '{n} giorni', 'validation.pickTimes': 'Scegli un orario per ogni giorno', 'ui.yes': 'Sì', 'ui.no': 'No', 'ui.rankHint': 'Fai clic sulle opzioni in ordine di preferenza', 'ui.rankReset': 'Ricomincia', 'ui.countryCode': 'Prefisso internazionale', 'validation.phone': 'Inserisci un numero di telefono valido', 'validation.phoneCountries': 'I numeri di questo paese non sono accettati', 'validation.emailDomains': 'Usa un indirizzo e-mail di un dominio consentito', 'validation.likertAll': 'Rispondi a tutte le affermazioni', 'validation.rankAll': 'Ordina tutte le opzioni', 'validation.rankTop': 'Scegli le tue prime {0}' },
  pt: { 'ui.prevMonth': 'Mês anterior', 'ui.nextMonth': 'Mês seguinte', 'ui.pickFirstDay': 'Escolha o primeiro dia', 'ui.pickLastDay': 'Escolha o último dia', 'ui.daysCount': '{n} dias', 'validation.pickTimes': 'Escolha um horário para cada dia', 'ui.yes': 'Sim', 'ui.no': 'Não', 'ui.rankHint': 'Clique nas opções por ordem de preferência', 'ui.rankReset': 'Recomeçar', 'ui.countryCode': 'Indicativo do país', 'validation.phone': 'Introduza um número de telefone válido', 'validation.phoneCountries': 'Não são aceites números deste país', 'validation.emailDomains': 'Use um e-mail de um domínio permitido', 'validation.likertAll': 'Responda a todas as afirmações', 'validation.rankAll': 'Ordene todas as opções', 'validation.rankTop': 'Escolha as suas {0} preferidas' },
  nl: { 'ui.prevMonth': 'Vorige maand', 'ui.nextMonth': 'Volgende maand', 'ui.pickFirstDay': 'Kies de eerste dag', 'ui.pickLastDay': 'Kies de laatste dag', 'ui.daysCount': '{n} dagen', 'validation.pickTimes': 'Kies voor elke dag een tijd', 'ui.yes': 'Ja', 'ui.no': 'Nee', 'ui.rankHint': 'Klik de opties aan in volgorde van voorkeur', 'ui.rankReset': 'Opnieuw beginnen', 'ui.countryCode': 'Landcode', 'validation.phone': 'Vul een geldig telefoonnummer in', 'validation.phoneCountries': 'Nummers uit dit land worden niet geaccepteerd', 'validation.emailDomains': 'Gebruik een e-mailadres van een toegestaan domein', 'validation.likertAll': 'Beantwoord elke stelling', 'validation.rankAll': 'Zet alle opties in volgorde', 'validation.rankTop': 'Kies uw top {0}' },
  pl: { 'ui.prevMonth': 'Poprzedni miesiąc', 'ui.nextMonth': 'Następny miesiąc', 'ui.pickFirstDay': 'Wybierz pierwszy dzień', 'ui.pickLastDay': 'Wybierz ostatni dzień', 'ui.daysCount': 'Dni: {n}', 'validation.pickTimes': 'Wybierz godzinę dla każdego dnia', 'ui.yes': 'Tak', 'ui.no': 'Nie', 'ui.rankHint': 'Klikaj opcje w kolejności od najbardziej preferowanej', 'ui.rankReset': 'Zacznij od nowa', 'ui.countryCode': 'Numer kierunkowy kraju', 'validation.phone': 'Podaj prawidłowy numer telefonu', 'validation.phoneCountries': 'Numery z tego kraju nie są akceptowane', 'validation.emailDomains': 'Użyj adresu e-mail z dozwolonej domeny', 'validation.likertAll': 'Odpowiedz na każde stwierdzenie', 'validation.rankAll': 'Uszereguj wszystkie opcje', 'validation.rankTop': 'Wybierz swoje top {0}' },
  ca: { 'ui.prevMonth': 'Mes anterior', 'ui.nextMonth': 'Mes següent', 'ui.pickFirstDay': 'Tria el primer dia', 'ui.pickLastDay': 'Tria l’últim dia', 'ui.daysCount': '{n} dies', 'validation.pickTimes': 'Tria una hora per a cada dia', 'ui.yes': 'Sí', 'ui.no': 'No', 'ui.rankHint': 'Fes clic a les opcions per ordre de preferència', 'ui.rankReset': 'Torna a començar', 'ui.countryCode': 'Prefix del país', 'validation.phone': 'Introdueix un número de telèfon vàlid', 'validation.phoneCountries': 'No s’accepten telèfons d’aquest país', 'validation.emailDomains': 'Fes servir un correu d’un domini permès', 'validation.likertAll': 'Respon a totes les afirmacions', 'validation.rankAll': 'Ordena totes les opcions', 'validation.rankTop': 'Tria les teves {0} preferides' },
  da: { 'ui.prevMonth': 'Forrige måned', 'ui.nextMonth': 'Næste måned', 'ui.pickFirstDay': 'Vælg den første dag', 'ui.pickLastDay': 'Vælg den sidste dag', 'ui.daysCount': '{n} dage', 'validation.pickTimes': 'Vælg et tidspunkt for hver dag', 'ui.yes': 'Ja', 'ui.no': 'Nej', 'ui.rankHint': 'Klik på mulighederne i den rækkefølge, du foretrækker dem', 'ui.rankReset': 'Start forfra', 'ui.countryCode': 'Landekode', 'validation.phone': 'Indtast et gyldigt telefonnummer', 'validation.phoneCountries': 'Telefonnumre fra dette land accepteres ikke', 'validation.emailDomains': 'Brug en e-mailadresse fra et tilladt domæne', 'validation.likertAll': 'Svar på alle udsagn', 'validation.rankAll': 'Placér alle mulighederne', 'validation.rankTop': 'Vælg dine top {0}' },
};

/** Languages that ship with built-in texts. Any other language falls back to English for these (and can override them). */
export const BUILT_IN_UI: { [language: string]: Dict } = {
  en: { ...EN, ...EXTRA.en, ...MORE.en },
  es: { ...ES, ...EXTRA.es, ...MORE.es },
  fr: { ...FR, ...EXTRA.fr, ...MORE.fr },
  de: { ...DE, ...EXTRA.de, ...MORE.de },
  it: { ...IT, ...EXTRA.it, ...MORE.it },
  pt: { ...PT, ...EXTRA.pt, ...MORE.pt },
  nl: { ...NL, ...EXTRA.nl, ...MORE.nl },
  pl: { ...PL, ...EXTRA.pl, ...MORE.pl },
  ca: { ...CA, ...EXTRA.ca, ...MORE.ca },
  da: { ...DA, ...EXTRA.da, ...MORE.da },
};

export const UI_KEYS = Object.keys(BUILT_IN_UI.en);

/* ------------------------------------------------------------------- lookup */

export type Translations = { [language: string]: { [key: string]: string } };

export type I18nConfig = {
  defaultLanguage?: string;
  languages?: string[];
  detect?: boolean;
  switcher?: 'none' | 'flags' | 'dropdown';
  translations?: Translations;
};

export const availableLanguages = (i18n?: I18nConfig): string[] => {
  const def = (i18n && i18n.defaultLanguage) || 'en';
  const list = (i18n && i18n.languages) || [];
  return [def, ...list.filter(l => l !== def)];
};

/** Finds `wanted` among `available`: exact (case-insensitive), then by base language ("pt-BR" ~ "pt"). */
export function matchLanguage(wanted: string, available: string[]): string | null {
  if (!wanted) return null;
  const lower = wanted.toLowerCase().replace('_', '-');
  const exact = available.find(a => a.toLowerCase() === lower);
  if (exact) return exact;
  const base = baseLanguage(lower);
  return available.find(a => baseLanguage(a) === base) || null;
}

/** Chooses the language to display: forced > browser language (when `detect` is on) > default. */
export function resolveLanguage(i18n: I18nConfig | undefined, forced?: string, browser?: readonly string[]): string {
  const available = availableLanguages(i18n);
  if (forced) {
    // a forced language is honoured even if it is not listed (the built-in texts still apply)
    return matchLanguage(forced, available) || forced;
  }
  if (i18n && i18n.detect !== false && available.length > 1) {
    const candidates = browser || (typeof navigator !== 'undefined' ? (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language]) : []);
    for (const candidate of candidates) {
      const match = matchLanguage(candidate, available);
      if (match) return match;
    }
  }
  return available[0];
}

const fill = (template: string, vars?: { [key: string]: any }) => (vars ? template.replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? String(vars[k]) : m)) : template);

/**
 * Returns a function that resolves built-in texts for `language`:
 * the form's own overrides (`translations[lang]['ui.submit']`) > built-in language > its base language > English.
 */
export function createTranslator(language: string, i18n?: I18nConfig) {
  const lang = (language || 'en').toLowerCase();
  const overrides = (i18n && i18n.translations && (i18n.translations[language] || i18n.translations[matchLanguage(language, Object.keys(i18n.translations || {})) || ''])) || {};
  const base = BUILT_IN_UI[lang] || BUILT_IN_UI[baseLanguage(lang)] || BUILT_IN_UI.en;
  return (key: string, vars?: { [key: string]: any }) => fill(overrides[key] || base[key] || BUILT_IN_UI.en[key] || key, vars);
}

/* --------------------------------------------------- translatable content */

export type Translatable = {
  key: string;
  /** Text in the default language. */
  source: string;
  /** Human readable context: "Email › Label". */
  group: string;
  label: string;
  multiline?: boolean;
};

const CONFIG_TEXT = ['nextLabel', 'caption', 'alt', 'minLabel', 'maxLabel', 'unit', 'title', 'subTitle', 'otherLabel', 'addLabel', 'itemLabel', 'itemMeta', 'emptyText', 'presetLabel', 'presetCustomLabel', 'confirmLabel', 'cancelLabel', 'addTitle', 'editTitle', 'backLabel', 'signLabel', 'tooltip', 'hint'];
/**
 * Preset values are data ({ name: 'Kitchen', units: [{ unit: 'Ceiling' }] }), but some of it is text people read. A repeater lists
 * the property names that hold such text in `config.presetTextKeys` (['name', 'unit']); only those strings are translatable.
 */
function mapPresetText(values: any, keys: string[], path: string, fn: (path: string, text: string) => string): any {
  if (Array.isArray(values)) return values.map((v, i) => mapPresetText(v, keys, `${path}.${i}`, fn));
  if (values && typeof values === 'object') {
    const next: { [k: string]: any } = {};
    Object.keys(values).forEach(k => {
      const v = values[k];
      next[k] = typeof v === 'string' ? (keys.includes(k) ? fn(`${path}.${k}`, v) : v) : mapPresetText(v, keys, `${path}.${k}`, fn);
    });
    return next;
  }
  return values;
}

const CONFIG_LABELS: { [k: string]: string } = {
  nextLabel: 'Next button',
  caption: 'Caption',
  alt: 'Image description',
  minLabel: 'Left label',
  maxLabel: 'Right label',
  unit: 'Unit',
  title: 'Upload text',
  subTitle: 'Upload hint',
  otherLabel: '“Other” option',
  addLabel: '“Add” button',
  itemLabel: 'Item title',
  itemMeta: 'Item summary',
  emptyText: 'Text when empty',
  presetLabel: 'Type picker label (dialog)',
  presetCustomLabel: 'Type picker “custom” entry',
  confirmLabel: 'Dialog “confirm” button',
  cancelLabel: 'Dialog “cancel” button',
  addTitle: 'Dialog title when adding',
  editTitle: 'Dialog title when editing',
  backLabel: '“Back” link of an open item',
  signLabel: '“Sign” button',
  tooltip: 'Help tooltip',
  hint: 'Hint inside the box',
};
const SETTINGS_TEXT: [string, string, boolean?][] = [
  ['submitButtonText', 'Submit button'],
  ['successMessage', 'Thank-you message', true],
  ['errorMessage', 'Error message', true],
  ['formErrorMessage', 'Form error message'],
  ['firstStepTitle', 'First step title'],
  ['firstStepDescription', 'First step description'],
  ['nextButtonText', 'Next button'],
  ['backButtonText', 'Back button'],
  ['firstStepImageAlt', 'First step picture description'],
  ['exitText', '“Save and exit” button'],
];

const fieldName = (field: FormField) => (field.label || field.checkboxLabel || field.content || field.model || field.type || '').toString().replace(/<[^>]*>/g, '').slice(0, 60) || field.type;

/** The author-written error message of a validation rule, if it has one, and where it sits in `params`. */
function ruleMessage(field: FormField, rule: { name: string; params?: any[] }): { text: string; index: number } | null {
  const spec = ruleSpecFor(rule.name, effectiveValidationType(field));
  const index = spec ? spec.params.length : rule.name === 'matches' ? 1 : ['required', 'email', 'url', 'integer', 'positive', 'negative'].includes(rule.name) ? 0 : 1;
  const text = rule.params && rule.params[index];
  return typeof text === 'string' && text ? { text, index } : null;
}

/** Every piece of form content that can be translated, in form order. */
export function collectTranslatables(doc: FormDocument): Translatable[] {
  const out: Translatable[] = [];
  const add = (key: string, source: any, group: string, label: string, multiline = false) => {
    if (typeof source === 'string' && source.trim()) out.push({ key, source, group, label, multiline });
  };
  add('title', doc.title, 'Form', 'Title');
  add('description', doc.description, 'Form', 'Description', true);
  const s = doc.settings || {};
  SETTINGS_TEXT.forEach(([key, label, multiline]) => add(`settings.${key}`, s[key], 'Form', label, !!multiline));
  const footer = doc.footer;
  if (footer) {
    add('footer.text', footer.text, 'Footer', 'Footer text', true);
    (footer.links || []).forEach((l, i) => add(`footer.link.${i}`, l.label, 'Footer', `Footer link ${i + 1}`));
    add('footer.copyright', footer.copyright, 'Footer', 'Copyright line');
  }

  // every block, repeater items included (rows only hold other fields)
  flattenFields(doc.fields, false, true).forEach(field => {
    if (field.type === 'columns') return;
    const group = fieldName(field);
    const id = field.id;
    const titleLike = ['heading', 'section', 'callout', 'pageBreak', 'button', 'modal'].includes(field.type);
    add(`field.${id}.label`, field.label, group, field.type === 'heading' || field.type === 'section' || field.type === 'callout' || field.type === 'modal' ? 'Title' : field.type === 'pageBreak' ? 'Step title' : field.type === 'button' ? 'Button text' : 'Question');
    add(`field.${id}.checkboxLabel`, field.checkboxLabel, group, 'Checkbox text');
    add(`field.${id}.helpText`, field.helpText, group, titleLike && field.type !== 'button' ? 'Subtitle' : 'Help text', true);
    add(`field.${id}.placeholder`, field.placeholder, group, 'Placeholder');
    add(`field.${id}.content`, field.content, group, 'Text', true);
    CONFIG_TEXT.forEach(k => add(`field.${id}.config.${k}`, field.config && field.config[k], group, CONFIG_LABELS[k]));
    (field.tabs || []).forEach(tab => add(`field.${id}.tab.${tab.id}`, tab.label, group, `Tab “${tab.label}”`));
    (field.options || []).forEach((option: any) => {
      add(`field.${id}.option.${String(option.value)}`, option.label, group, `Option “${option.label}”`);
      add(`field.${id}.optionDesc.${String(option.value)}`, option.description, group, `Description of “${option.label}”`, true);
    });
    // the statements of a Likert table
    ((field.config && field.config.rows) || []).forEach((row: any) => add(`field.${id}.row.${String(row.value)}`, row.label, group, `Statement “${row.label}”`));
    ((field.config && field.config.presets) || []).forEach((preset: any, i: number) => {
      add(`field.${id}.preset.${i}.label`, preset.label, group, `Choice “${preset.label}”`);
      add(`field.${id}.preset.${i}.description`, preset.description, group, `Description of “${preset.label}”`, true);
      const textKeys: string[] = (field.config && field.config.presetTextKeys) || [];
      if (textKeys.length && preset.values) mapPresetText(preset.values, textKeys, `field.${id}.preset.${i}.value`, (path, text) => (add(path, text, group, `“${preset.label}”: ${text}`), text));
    });
    Array.from(new Set((field.options || []).map((o: any) => o.group).filter(Boolean))).forEach((g: any) => add(`field.${id}.group.${g}`, g, group, `Option group “${g}”`));
    (field.validations || []).forEach(rule => {
      const message = ruleMessage(field, rule);
      if (message) add(`field.${id}.validation.${rule.name}`, message.text, group, `Error message (${rule.name})`);
    });
  });
  return out;
}

/** Returns a copy of `doc` with the texts of `language` applied. Missing translations keep the default text. */
export function localizeDocument(doc: FormDocument, language: string): FormDocument {
  const i18n = doc.i18n as I18nConfig | undefined;
  if (!i18n || !i18n.translations) return doc;
  const available = availableLanguages(i18n);
  if (matchLanguage(language, [available[0]])) return doc; // the default language is the document itself
  const dict = i18n.translations[language] || i18n.translations[matchLanguage(language, Object.keys(i18n.translations)) || ''];
  if (!dict) return doc;
  const tr = (key: string, fallback: any) => (typeof dict[key] === 'string' && dict[key].length ? dict[key] : fallback);

  const localizeField = (field: FormField): FormField => {
    if (isContainer(field)) {
      return { ...field, columns: (field.columns || []).map(c => ({ ...c, fields: c.fields.map(localizeField) })) };
    }
    const id = field.id;
    const next: FormField = { ...field };
    if (field.type === 'section' || field.type === 'repeater' || field.type === 'modal') next.fields = (field.fields || []).map(localizeField);
    if (field.type === 'tabs') next.tabs = (field.tabs || []).map(tab => ({ ...tab, label: tr(`field.${id}.tab.${tab.id}`, tab.label), fields: (tab.fields || []).map(localizeField) }));
    (['label', 'checkboxLabel', 'helpText', 'placeholder', 'content'] as const).forEach(prop => {
      if (typeof field[prop] === 'string') next[prop] = tr(`field.${id}.${prop}`, field[prop]);
    });
    if (field.config) {
      next.config = { ...field.config };
      CONFIG_TEXT.forEach(k => {
        if (typeof field.config![k] === 'string') next.config![k] = tr(`field.${id}.config.${k}`, field.config![k]);
      });
    }
    if (field.options) {
      next.options = field.options.map((o: any) => ({
        ...o,
        label: tr(`field.${id}.option.${String(o.value)}`, o.label),
        ...(o.group ? { group: tr(`field.${id}.group.${o.group}`, o.group) } : {}),
        ...(typeof o.description === 'string' ? { description: tr(`field.${id}.optionDesc.${String(o.value)}`, o.description) } : {}),
      }));
    }
    if (field.config && Array.isArray(field.config.rows)) {
      next.config = { ...(next.config || field.config), rows: field.config.rows.map((row: any) => ({ ...row, label: tr(`field.${id}.row.${String(row.value)}`, row.label) })) };
    }
    if (field.config && Array.isArray(field.config.presets)) {
      next.config = {
        ...(next.config || field.config),
        presets: field.config.presets.map((p: any, i: number) => {
          const textKeys: string[] = field.config!.presetTextKeys || [];
          return {
            ...p,
            label: tr(`field.${id}.preset.${i}.label`, p.label),
            ...(typeof p.description === 'string' ? { description: tr(`field.${id}.preset.${i}.description`, p.description) } : {}),
            ...(textKeys.length && p.values ? { values: mapPresetText(p.values, textKeys, `field.${id}.preset.${i}.value`, (path, text) => tr(path, text)) } : {}),
          };
        }),
      };
    }
    if (field.validations) {
      next.validations = field.validations.map(rule => {
        const key = `field.${id}.validation.${rule.name}`;
        const message = ruleMessage(field, rule);
        if (!dict[key] || !message) return rule;
        const params = [...(rule.params || [])];
        params[message.index] = dict[key];
        return { ...rule, params };
      });
    }
    return next;
  };

  const s = doc.settings || {};
  const settings = { ...s };
  SETTINGS_TEXT.forEach(([k]) => {
    if (typeof s[k] === 'string') settings[k] = tr(`settings.${k}`, s[k]);
  });

  const footer = doc.footer
    ? {
        ...doc.footer,
        text: typeof doc.footer.text === 'string' ? tr('footer.text', doc.footer.text) : doc.footer.text,
        copyright: typeof doc.footer.copyright === 'string' ? tr('footer.copyright', doc.footer.copyright) : doc.footer.copyright,
        links: (doc.footer.links || []).map((l, i) => ({ ...l, label: tr(`footer.link.${i}`, l.label) })),
      }
    : undefined;
  return { ...doc, title: tr('title', doc.title), description: tr('description', doc.description), settings, ...(footer ? { footer } : {}), fields: doc.fields.map(localizeField) };
}

/** How much of the form is translated into `language` (0-1). */
export function translationProgress(doc: FormDocument, language: string): { done: number; total: number } {
  const items = collectTranslatables(doc);
  const dict = (doc.i18n && (doc.i18n as I18nConfig).translations && (doc.i18n as I18nConfig).translations![language]) || {};
  return { done: items.filter(i => dict[i.key] && dict[i.key].trim()).length, total: items.length };
}

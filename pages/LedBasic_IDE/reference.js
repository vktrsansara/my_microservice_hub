// =============================================================
//  LedBasic IDE — Справочник языка
//  Отдельный файл: reference.js
//  Подключается в index.html через <script src="reference.js">
// =============================================================

const REFERENCE = [

// ─────────────────────────────────────────────────────────────
{
  id:'syntax', label:'Синтаксис',
  html:`
<div class="ref-section">
  <div class="ref-section-title">Структура программы</div>
  <table class="ref-table">
    <thead><tr><th>Элемент</th><th>Формат</th><th>Описание</th></tr></thead>
    <tbody>
      <tr><td>Строка</td><td>10 команда</td><td>Начинается с номера 1–65534. Выполняется по порядку возрастания.</td></tr>
      <tr><td>Комментарий</td><td>' текст</td><td>Апостроф — всё до конца строки игнорируется.</td></tr>
      <tr><td>Скобки</td><td>( выражение )</td><td>Группировка вычислений: (X + T) % 256</td></tr>
      <tr><td>Многострочность</td><td>10 A=0  11 B=1</td><td>Два оператора в одной текстовой строке (разделитель — два пробела).</td></tr>
    </tbody>
  </table>
  <div class="ref-example">' Минимальная программа — радуга
10 H = 0
20 FOR I = 0 TO PIXEL
30   SET_HSV I , H + I * 8 , 255 , 180
40 NEXT I
50 WAIT 30          ' SHOW + пауза 30 мс
60 H = H + 3
70 IF H > 255 THEN H = H - 256
80 GOTO 20          ' бесконечный цикл</div>
</div>

<div class="ref-section">
  <div class="ref-section-title">Переменные</div>
  <table class="ref-table">
    <thead><tr><th>Имя</th><th>Тип</th><th>Диапазон</th><th>Описание</th></tr></thead>
    <tbody>
      <tr><td>A .. Z</td><td>int16</td><td>-32768 .. 32767</td><td>26 переменных. Сбрасываются в 0 при play().</td></tr>
    </tbody>
  </table>
  <div class="ref-note">Переменные — только одна буква A–Z. Нет массивов, строк, float. Для передачи параметров в подпрограммы используй глобальные переменные.</div>
</div>

<div class="ref-section">
  <div class="ref-section-title">Порядок выполнения</div>
  <table class="ref-table">
    <thead><tr><th>Ситуация</th><th>Поведение</th></tr></thead>
    <tbody>
      <tr><td>Следующая строка</td><td>Выполняется строка со следующим номером</td></tr>
      <tr><td>GOTO / IF THEN GOTO</td><td>Переход на указанную строку</td></tr>
      <tr><td>Конец программы</td><td>VM останавливается (isRunning() = false)</td></tr>
      <tr><td>WAIT / DELAY</td><td>Прерывает tick() — следующий вызов продолжит</td></tr>
    </tbody>
  </table>
</div>`
},

// ─────────────────────────────────────────────────────────────
{
  id:'commands', label:'Команды',
  html:`
<div class="ref-section">
  <div class="ref-section-title">LED — управление лентой</div>
  <table class="ref-table">
    <thead><tr><th>Команда</th><th>Аргументы</th><th>Описание</th></tr></thead>
    <tbody>
      <tr><td>SET</td><td>pos , r , g , b</td><td>Пиксель pos = RGB. r,g,b: 0..255.</td></tr>
      <tr><td>SET_HSV</td><td>pos , h , s , v</td><td>Пиксель pos = HSV. Все 0..255. FastLED-алгоритм.</td></tr>
      <tr><td>FILL</td><td>r , g , b</td><td>Залить всю ленту одним RGB-цветом.</td></tr>
      <tr><td>CLEAR</td><td>—</td><td>Погасить всю ленту. Сбрасывает внутренний буфер.</td></tr>
      <tr><td>SHOW</td><td>—</td><td>Вывести буфер на ленту без паузы.</td></tr>
      <tr><td>WAIT</td><td>ms</td><td>SHOW + пауза ms мс. Основной способ показа кадра.</td></tr>
      <tr><td>DELAY</td><td>ms</td><td>Пауза без SHOW. Для задержек между шагами.</td></tr>
      <tr><td>FADE</td><td>pos , amt</td><td>Вычесть amt из R,G,B пикселя pos. Читает pixelBuf. Основа хвостов.</td></tr>
      <tr><td>MIRROR</td><td>—</td><td>Скопировать пиксели 0..N/2-1 зеркально в конец ленты.</td></tr>
      <tr><td>BRIGHT</td><td>val</td><td>Глобальная яркость (зависит от NeoPixelBrightnessBus).</td></tr>
    </tbody>
  </table>
  <div class="ref-example">10 SET_HSV 0 , 0 , 255 , 255    ' пиксель 0 = насыщ. красный
20 SET 5 , 0 , 0 , 255         ' пиксель 5 = синий RGB
30 FILL 0 , 80 , 0             ' вся лента = тёмно-зелёный
40 FADE 3 , 40                 ' пиксель 3 чуть темнее (хвост)
50 MIRROR                      ' отразить в другую половину
60 WAIT 100                    ' показать и подождать</div>
  <div class="ref-warn">FADE и MIRROR читают внутренний буфер pixelBuf. Используй SET/SET_HSV/FILL — они синхронно обновляют буфер. CLEAR сбрасывает буфер в 0.</div>
</div>

<div class="ref-section">
  <div class="ref-section-title">Управление потоком</div>
  <table class="ref-table">
    <thead><tr><th>Команда</th><th>Синтаксис</th><th>Описание</th></tr></thead>
    <tbody>
      <tr><td>GOTO</td><td>GOTO n</td><td>Переход на строку n. n может быть переменной (GOTO A).</td></tr>
      <tr><td>GOSUB</td><td>GOSUB n</td><td>Вызов подпрограммы. Стек 10 уровней.</td></tr>
      <tr><td>RETURN</td><td>RETURN</td><td>Возврат из подпрограммы.</td></tr>
      <tr><td>FOR</td><td>FOR v = a TO b STEP s</td><td>Цикл. STEP необязателен (=1). s может быть отрицательным. Вложенность до 8.</td></tr>
      <tr><td>NEXT</td><td>NEXT v</td><td>Конец тела FOR.</td></tr>
      <tr><td>IF</td><td>IF expr op expr THEN cmd</td><td>Условное выполнение одной команды. Операторы: == != &gt; &lt; &gt;= &lt;=</td></tr>
    </tbody>
  </table>
  <div class="ref-example">10 FOR I = 0 TO PIXEL STEP 2   ' каждый второй пиксель
20   SET_HSV I , H , 255 , 200
30 NEXT I
40 IF H > 200 THEN GOSUB 500   ' условный вызов подпрограммы
50 GOTO 10
500 FILL 0 , 0 , 0
510 WAIT 500
520 RETURN</div>
  <div class="ref-warn">IF выполняет только ОДНУ команду после THEN. Для блока — используй GOSUB.</div>
</div>`
},

// ─────────────────────────────────────────────────────────────
{
  id:'operators', label:'Операторы',
  html:`
<div class="ref-section">
  <div class="ref-section-title">Арифметика</div>
  <table class="ref-table">
    <thead><tr><th>Оператор</th><th>Пример</th><th>Описание</th></tr></thead>
    <tbody>
      <tr><td>+</td><td>A + B</td><td>Сложение</td></tr>
      <tr><td>-</td><td>A - B</td><td>Вычитание. Унарный минус: -A</td></tr>
      <tr><td>*</td><td>A * B</td><td>Умножение. Переполнение int16 при результате &gt;32767!</td></tr>
      <tr><td>/</td><td>A / B</td><td>Целочисленное деление. B=0 → результат 0 (безопасно).</td></tr>
      <tr><td>%</td><td>A % B</td><td>Остаток от деления (MOD). Полезен для цикличности.</td></tr>
    </tbody>
  </table>
  <div class="ref-example">' % (MOD) — очень полезен:
30   R = I % 3          ' 0 для пикселей 0,3,6,...  1 для 1,4,7,...  2 для 2,5,8,...
40   H = T % 256        ' обёртка 0..255
50   Z = R % 2          ' чётность: 0 или 1</div>
  <div class="ref-warn">Умножение: (uint8_t)255 * (int16_t)255 = 65025 — переполнение! Используй промежуточный расчёт: V = N * 4 / 7, а не N * 4 сразу если N может быть > 127.</div>
</div>

<div class="ref-section">
  <div class="ref-section-title">Операторы сравнения (только в IF)</div>
  <table class="ref-table">
    <thead><tr><th>Оператор</th><th>Значение</th><th>Пример</th></tr></thead>
    <tbody>
      <tr><td>==</td><td>равно</td><td>IF A == 0 THEN GOTO 10</td></tr>
      <tr><td>!=</td><td>не равно</td><td>IF A != B THEN SET P , 255 , 0 , 0</td></tr>
      <tr><td>&gt;</td><td>больше</td><td>IF H &gt; 255 THEN H = H - 256</td></tr>
      <tr><td>&lt;</td><td>меньше</td><td>IF V &lt; 10 THEN GOSUB 500</td></tr>
      <tr><td>&gt;=</td><td>не меньше</td><td>IF P &gt;= PIXEL THEN P = 0</td></tr>
      <tr><td>&lt;=</td><td>не больше</td><td>IF I &lt;= N THEN GOTO 20</td></tr>
    </tbody>
  </table>
</div>

<div class="ref-section">
  <div class="ref-section-title">Побитовые операторы</div>
  <table class="ref-table">
    <thead><tr><th>Оператор</th><th>Пример</th><th>Описание</th></tr></thead>
    <tbody>
      <tr><td>AND</td><td>X AND 255</td><td>Побитовое И. Маскировка: K = I * 37 AND 255</td></tr>
      <tr><td>OR</td><td>A OR B</td><td>Побитовое ИЛИ.</td></tr>
    </tbody>
  </table>
  <div class="ref-example">' Псевдослучайный сдвиг фазы (TwinkleFOX):
30   K = I * 37 AND 255    ' уникальный хэш для каждого пикселя
40   V = SIN8 T + K        ' каждый пиксель мерцает в своей фазе</div>
</div>

<div class="ref-section">
  <div class="ref-section-title">Приоритет операторов (от высшего к низшему)</div>
  <table class="ref-table">
    <thead><tr><th>Уровень</th><th>Операторы</th><th>Направление</th></tr></thead>
    <tbody>
      <tr><td>1 (высший)</td><td>( )  — скобки</td><td>изнутри наружу</td></tr>
      <tr><td>2</td><td>унарный -</td><td>справа налево</td></tr>
      <tr><td>3</td><td>*  /  %</td><td>слева направо</td></tr>
      <tr><td>4 (низший)</td><td>+  -  AND  OR</td><td>слева направо</td></tr>
    </tbody>
  </table>
  <div class="ref-example">' Порядок вычислений без скобок:
H + I * 256 / PIXEL   →   H + ((I * 256) / PIXEL)   ✓ правильно
(H + I) * 256 / PIXEL →   ((H + I) * 256) / PIXEL   ← другой результат!</div>
</div>`
},

// ─────────────────────────────────────────────────────────────
{
  id:'functions', label:'Функции',
  html:`
<div class="ref-section">
  <div class="ref-section-title">Математические функции</div>
  <table class="ref-table">
    <thead><tr><th>Функция</th><th>Аргументы</th><th>Результат</th><th>Описание</th></tr></thead>
    <tbody>
      <tr><td>ABS x</td><td>int16</td><td>int16 ≥ 0</td><td>Модуль. ABS -5 = 5</td></tr>
      <tr><td>MIN a , b</td><td>int16, int16</td><td>int16</td><td>Меньшее из двух</td></tr>
      <tr><td>MAX a , b</td><td>int16, int16</td><td>int16</td><td>Большее из двух</td></tr>
      <tr><td>RND min , max</td><td>int16, int16</td><td>int16</td><td>Случайное целое, включая границы</td></tr>
      <tr><td>MAP val,i0,i1,o0,o1</td><td>5× int16</td><td>int16</td><td>Линейное масштабирование диапазона. Как Arduino map().</td></tr>
      <tr><td>CONSTRAIN val,lo,hi</td><td>3× int16</td><td>int16</td><td>Обрезать до диапазона lo..hi. Как Arduino constrain().</td></tr>
    </tbody>
  </table>
  <div class="ref-example">' MAP: шум/SIN8 (0..255) → оттенок синей зоны (85..200)
50   H = MAP N , 0 , 255 , 85 , 200
' CONSTRAIN: защита после сложения двух шумов
60   V = CONSTRAIN N1 + N2 , 0 , 255
' MIN / MAX: обрезка яркости
70   V = MAX V , 0      ' не уйти в отрицательные
80   V = MIN V , 255    ' не превысить 255</div>
</div>

<div class="ref-section">
  <div class="ref-section-title">Тригонометрия</div>
  <table class="ref-table">
    <thead><tr><th>Функция</th><th>Вход</th><th>Выход</th><th>Описание</th></tr></thead>
    <tbody>
      <tr><td>SIN8 x</td><td>0..255</td><td>0..255</td><td>Синус. 256 значений = полный период (0→255→0→255→...).</td></tr>
      <tr><td>COS8 x</td><td>0..255</td><td>0..255</td><td>Косинус. COS8 x = SIN8 (x + 64).</td></tr>
    </tbody>
  </table>
  <div class="ref-example">' Бегущая синусоидальная волна:
20 FOR I = 0 TO PIXEL
30   V = SIN8 T + I * 8    ' T — фаза волны, I*8 — сдвиг по позиции
40   SET_HSV I , 160 , 255 , V
50 NEXT I
60 WAIT 20
70 T = T + 4
80 IF T > 255 THEN T = T - 256  ' плавная обёртка!
90 GOTO 20</div>
</div>

<div class="ref-section">
  <div class="ref-section-title">Гамма и шум</div>
  <table class="ref-table">
    <thead><tr><th>Функция</th><th>Вход</th><th>Выход</th><th>Описание</th></tr></thead>
    <tbody>
      <tr><td>EXP8 x</td><td>0..255</td><td>0..255</td><td>Гамма 2.2: round(255×(x/255)²·²). Делает яркость естественной.</td></tr>
      <tr><td>NOISE x , t</td><td>0..65535, 0..65535</td><td>0..255</td><td>2D Value Noise. x — позиция, t — время. Не сбрасывай t через 255!</td></tr>
    </tbody>
  </table>
  <div class="ref-example">' EXP8: ключевые значения
' EXP8(0)=0  EXP8(64)=12  EXP8(128)=56  EXP8(192)=137  EXP8(255)=255
' Линейное дыхание → с EXP8: долго тёмный, резкий пик
20 V = SIN8 T
30 V = EXP8 V       ' добавить гамму = естественное дыхание

' NOISE: масштаб пространства
30   X = I * 25     ' крупные пятна (медленнее)
30   X = I * 80     ' мелкие детали (быстрее)
' Правильная обёртка T:
110 T = T + 5
120 IF T > 32000 THEN T = 0   ' НЕ T > 255 — иначе рывок!</div>
</div>

<div class="ref-section">
  <div class="ref-section-title">PIXEL и HSV-палитра</div>
  <table class="ref-table">
    <thead><tr><th>Функция</th><th>Вход</th><th>Выход</th></tr></thead>
    <tbody>
      <tr><td>PIXEL</td><td>—</td><td>num_leds − 1 (макс. индекс)</td></tr>
    </tbody>
  </table>
  <table class="ref-table" style="margin-top:8px">
    <thead><tr><th>H (оттенок)</th><th>Цвет</th><th>H</th><th>Цвет</th></tr></thead>
    <tbody>
      <tr><td>0</td><td>🔴 Красный</td><td>128</td><td>🩵 Голубой</td></tr>
      <tr><td>21</td><td>🟠 Оранжевый</td><td>170</td><td>🔵 Синий</td></tr>
      <tr><td>42</td><td>🟡 Жёлтый</td><td>192</td><td>🟣 Фиолетовый</td></tr>
      <tr><td>85</td><td>🟢 Зелёный</td><td>213</td><td>💗 Пурпурный</td></tr>
    </tbody>
  </table>
  <div class="ref-note">S=255 — насыщенный цвет. S=0 — белый. V=255 — макс. яркость. V=0 — чёрный.</div>
</div>`
},

// ─────────────────────────────────────────────────────────────
{
  id:'patterns', label:'Паттерны',
  html:`
<div class="ref-section">
  <div class="ref-section-title">Бесконечный цикл анимации</div>
  <div class="ref-example">100 ' ...рисуем кадр...
200 WAIT 30       ' показать + пауза
300 GOTO 100      ' следующий кадр</div>
</div>

<div class="ref-section">
  <div class="ref-section-title">Правильная обёртка счётчика</div>
  <div class="ref-example">' ✓ ПРАВИЛЬНО для SIN8/COS8 (период 256):
70 T = T + 3
80 IF T > 255 THEN T = T - 256   ' плавный переход через 0

' ✓ ПРАВИЛЬНО для NOISE (длинный период):
120 T = T + 5
130 IF T > 32000 THEN T = 0      ' незаметный сброс

' ✗ НЕПРАВИЛЬНО для NOISE:
80 IF T > 255 THEN T = 0         ' рывок! NOISE(x,255) ≠ NOISE(x,0)</div>
</div>

<div class="ref-section">
  <div class="ref-section-title">Передача параметров в GOSUB</div>
  <div class="ref-example">' Передача через глобальные переменные перед GOSUB:
110 V = A         ' яркость
111 P = I         ' позиция
112 GOSUB 600     ' вызов

600 IF V &lt;= 0 THEN RETURN     ' guard clause
601 IF P &gt; PIXEL THEN RETURN  ' защита от выхода за ленту
610 IF V &gt; 200 THEN SET P , 255 , 255 , 255
611 IF V &gt; 200 THEN RETURN
620 SET_HSV P , 0 , 255 , V
630 RETURN</div>
</div>

<div class="ref-section">
  <div class="ref-section-title">Хвост через FADE</div>
  <div class="ref-example">' Перед каждым кадром тускнеем всю ленту:
100 FOR I = 0 TO PIXEL
110   FADE I , 30    ' 30 = короткий хвост, 8 = длинный
120 NEXT I
130 SET_HSV P , H , 255 , 255   ' рисуем голову
140 WAIT 25</div>
</div>

<div class="ref-section">
  <div class="ref-section-title">Декодирование пикселя матрицы 16×16 (змейка)</div>
  <div class="ref-example">20 FOR I = 0 TO 255
30   R = I / 16          ' строка (0..15)
40   C = I % 16          ' столбец сырой (0..15)
50   Z = R % 2
60   IF Z == 1 THEN C = 15 - C   ' нечётные строки — зеркало!
70   X = C               ' X-координата (0..15)
80   Y = R               ' Y-координата (0..15)
90   ' ... рисуем пиксель I используя X и Y ...
100 NEXT I</div>
</div>

<div class="ref-section">
  <div class="ref-section-title">FBM — многооктавный шум</div>
  <div class="ref-example">' Три октавы: крупные пятна + средняя рябь + мелкие детали
30   X = I * 25
40   N = NOISE X , T              ' октава 1: крупные
50   U = X * 3
60   B = NOISE U , T * 2          ' октава 2: мельче и быстрее
70   N = N * 2 + B
80   N = N / 3                    ' нормализация</div>
</div>

<div class="ref-section">
  <div class="ref-section-title">Конвейер обработки яркости</div>
  <div class="ref-example">' 1. Генерация:  N = NOISE X , T          (0..255)
' 2. Масштаб:    H = MAP N , 0,255 , 85,200  (диапазон оттенка)
' 3. Защита:     N = CONSTRAIN N , 0 , 255   (гарантия диапазона)
' 4. Гамма:      V = EXP8 N                  (нелинейность глаза)
' 5. Вывод:      SET_HSV I , H , 255 , V</div>
</div>

<div class="ref-section">
  <div class="ref-section-title">Лимиты виртуальной машины</div>
  <table class="ref-table">
    <thead><tr><th>Ресурс</th><th>Лимит</th></tr></thead>
    <tbody>
      <tr><td>Переменные</td><td>26 (A–Z), int16</td></tr>
      <tr><td>Строк программы</td><td>128</td></tr>
      <tr><td>Стек GOSUB</td><td>10 уровней</td></tr>
      <tr><td>Вложенность FOR</td><td>8 уровней</td></tr>
      <tr><td>Байт-код</td><td>~4 КБ</td></tr>
      <tr><td>Скорость</td><td>setSpeed: 1..1000%</td></tr>
    </tbody>
  </table>
</div>`
}

]; // end REFERENCE

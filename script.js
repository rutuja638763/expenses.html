  const $ = id => document.getElementById(id);
    const categories = ["Food", "Shopping", "Transport", "Other"];
    const money = n => n.toLocaleString("en-IN", {
      style: "currency", currency: "INR"
    });
    const today = new Date();
    const localDate = d =>
      `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;

    $("date").value = localDate(today);
    $("monthLabel").textContent =
      "TOTAL SPENT IN " +
      today.toLocaleDateString("en-IN", {month:"long", year:"numeric"}).toUpperCase();

    let expenses = [];
    try {
      const saved = JSON.parse(localStorage.getItem("myWalletExpenses") || "[]");
      if (Array.isArray(saved)) {
        expenses = saved.filter(e =>
          e && typeof e.id === "string" &&
          typeof e.title === "string" &&
          Number.isFinite(e.amount) && e.amount > 0 &&
          categories.includes(e.category) &&
          /^\d{4}-\d{2}-\d{2}$/.test(e.date)
        );
      }
    } catch (error) {
      expenses = [];
    }

    function save() {
      try {
        localStorage.setItem("myWalletExpenses", JSON.stringify(expenses));
        return true;
      } catch (error) {
        alert("Could not save data. Your browser storage may be unavailable or full.");
        return false;
      }
    }

    function render() {
      const month = localDate(today).slice(0, 7);
      const monthly = expenses.filter(e => e.date.startsWith(month));
      const total = monthly.reduce((sum, e) => sum + e.amount, 0);

      $("monthlyTotal").textContent = money(total);
      $("expenseCount").textContent =
        `${monthly.length} expense${monthly.length === 1 ? "" : "s"} this month`;

      const ids = {
        Food: "foodTotal",
        Shopping: "shoppingTotal",
        Transport: "transportTotal",
        Other: "otherTotal"
      };

      categories.forEach(category => {
        const sum = monthly
          .filter(e => e.category === category)
          .reduce((n, e) => n + e.amount, 0);
        $(ids[category]).textContent = money(sum);
      });

      const filter = $("filter").value;
      const visible = expenses
        .filter(e => filter === "All" || e.category === filter)
        .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));

      const list = $("expenseList");
      list.replaceChildren();

      if (!visible.length) {
        const empty = document.createElement("p");
        empty.className = "empty";
        empty.textContent = "No expenses yet. Add your first one above!";
        list.append(empty);
        return;
      }

      visible.forEach(e => {
        const row = document.createElement("div");
        row.className = "expense";

        const info = document.createElement("div");
        const name = document.createElement("strong");
        name.textContent = e.title;
        const detail = document.createElement("p");
        detail.textContent = `${e.category} · ${e.date}`;
        info.append(name, detail);

        const right = document.createElement("div");
        right.className = "amount";
        const value = document.createElement("div");
        value.textContent = money(e.amount);
        const del = document.createElement("button");
        del.className = "delete";
        del.textContent = "Delete";
        del.setAttribute("aria-label", "Delete " + e.title);
        del.addEventListener("click", () => {
          if (confirm("Delete this expense?")) {
            const previous = expenses;
            expenses = expenses.filter(item => item.id !== e.id);
            if (!save()) {
              expenses = previous;
            }
            render();
          }
        });

        right.append(value, del);
        row.append(info, right);
        list.append(row);
      });
    }

    $("expenseForm").addEventListener("submit", event => {
      event.preventDefault();

      const title = $("title").value.trim();
      const amount = Number($("amount").value);
      const category = $("category").value;
      const date = $("date").value;

      if (!title || !Number.isFinite(amount) || amount <= 0 ||
          amount > 100000000 || !categories.includes(category) ||
          !date || date > "9999-12-31") {
        alert("Please enter a valid description, amount, category and date.");
        return;
      }

      const expense = {
        id: Date.now().toString() + Math.random().toString(36).slice(2),
        title, amount, category, date
      };

      expenses.push(expense);
      if (!save()) {
        expenses.pop();
        return;
      }

      $("title").value = "";
      $("amount").value = "";
      $("date").value = localDate(today);
      render();
    });

    $("filter").addEventListener("change", render);
    render();
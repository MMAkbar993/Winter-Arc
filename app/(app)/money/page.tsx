import type { Metadata } from "next";
import { Briefcase, CircleDollarSign, Landmark, Percent, PiggyBank, Receipt } from "lucide-react";
import { BarList } from "@/components/charts/bar-list";
import { GroupedBarChart } from "@/components/charts/lazy-charts";
import { DeleteButton } from "@/components/shared/delete-button";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { RecordList } from "@/components/shared/record-list";
import { Section } from "@/components/shared/section";
import { StatCard, StatGrid } from "@/components/shared/stat-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { deleteExpense, deleteIncome, deleteSavings } from "@/features/money/actions";
import { BudgetGuidance } from "@/features/money/components/budget-guidance";
import { TransactionCard } from "@/features/money/components/transaction-card";
import { getMoneyData } from "@/features/money/queries";
import { EditRecordButton } from "@/features/quick-add/edit-record-button";
import { AddButton } from "@/features/quick-add/quick-action-button";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, labelFor } from "@/lib/constants";
import { requireOnboardedContext } from "@/lib/data/context";
import { formatCurrency, percent } from "@/lib/format";
import { str } from "@/lib/options";

export const metadata: Metadata = { title: "Money" };

export default async function MoneyPage() {
  const ctx = await requireOnboardedContext();
  const { settings } = ctx;
  const { currency } = settings;
  const data = await getMoneyData(ctx);
  const { month } = data;

  return (
    <div className="grid grid-cols-1 gap-6">
      <PageHeader
        title="Money"
        description="Earn, spend with intent, save first."
        actions={
          <>
            <AddButton kind="expense" variant="outline" />
            <AddButton kind="savings" variant="outline" />
            <AddButton kind="income" />
          </>
        }
      />

      <StatGrid>
        <StatCard
          label="Income this month"
          icon={CircleDollarSign}
          tone="brand"
          value={formatCurrency(month.income, currency)}
          progress={settings.monthlyIncomeGoal > 0 ? percent(month.income, settings.monthlyIncomeGoal) : undefined}
          hint={settings.monthlyIncomeGoal > 0 ? `Goal ${formatCurrency(settings.monthlyIncomeGoal, currency)}` : undefined}
        />
        <StatCard label="Expenses this month" icon={Receipt} value={formatCurrency(month.expenses, currency)} />
        <StatCard
          label="Savings this month"
          icon={PiggyBank}
          value={formatCurrency(month.savings, currency)}
          progress={settings.monthlySavingsGoal > 0 ? percent(month.savings, settings.monthlySavingsGoal) : undefined}
          hint={settings.monthlySavingsGoal > 0 ? `Goal ${formatCurrency(settings.monthlySavingsGoal, currency)}` : undefined}
        />
        <StatCard label="Savings rate" icon={Percent} value={`${month.savingsRate}%`} hint="Of this month's income" />
        <StatCard label="Business investment" icon={Briefcase} value={formatCurrency(month.businessInvestment, currency)} hint="Business + education" />
        <StatCard
          label="Winter Arc revenue"
          icon={Landmark}
          value={formatCurrency(data.challengeRevenue, currency)}
          hint={`${formatCurrency(data.challengeSavings, currency)} saved this arc`}
        />
      </StatGrid>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Section id="monthly" title="Monthly performance" description="Income, expenses and net savings — last 6 months">
          <GroupedBarChart
            data={data.monthly.map((m) => ({ ...m }))}
            xKey="month"
            series={[
              { key: "income", name: "Income" },
              { key: "expenses", name: "Expenses" },
              { key: "savings", name: "Savings" },
            ]}
            format={{ currency }}
            formatX="month"
            label={`Monthly income, expenses and savings. This month: income ${formatCurrency(month.income, currency)}, expenses ${formatCurrency(month.expenses, currency)}, savings ${formatCurrency(month.savings, currency)}.`}
          />
        </Section>
        <Section id="budget" title="Budget guidance" description="Optional reference split of this month's income">
          <BudgetGuidance lines={data.budget} income={month.income} currency={currency} />
        </Section>
      </div>

      <Section id="spending" title="Spending by category" description="This month">
        <BarList
          items={data.expensesByCategory.map((e) => ({ label: labelFor(EXPENSE_CATEGORIES, e.category), value: e.amount }))}
          format={(v) => formatCurrency(v, currency)}
          emptyLabel="No expenses this month."
        />
      </Section>

      <Section id="transactions" title="Transactions" description="Last 6 months">
        <Tabs defaultValue="income">
          <TabsList>
            <TabsTrigger value="income">Income ({data.income.length})</TabsTrigger>
            <TabsTrigger value="expenses">Expenses ({data.expenses.length})</TabsTrigger>
            <TabsTrigger value="savings">Savings ({data.savings.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="income">
            {data.income.length === 0 ? (
              <EmptyState compact icon={CircleDollarSign} title="No income yet" description="Log your first Fiverr order or client payment." />
            ) : (
              <RecordList>
                {data.income.map((t) => (
                  <TransactionCard
                    key={t.id}
                    type="income"
                    title={t.source ?? t.client ?? labelFor(INCOME_CATEGORIES, t.category)}
                    date={t.txn_date}
                    detail={[labelFor(INCOME_CATEGORIES, t.category), t.client, t.projects?.name].filter(Boolean).join(" · ")}
                    amount={Number(t.amount)}
                    currency={currency}
                    actions={
                      <>
                        <EditRecordButton
                          kind="income"
                          id={t.id}
                          title="Edit income"
                          initial={{
                            date: t.txn_date,
                            amount: str(t.amount),
                            source: str(t.source),
                            client: str(t.client),
                            projectId: str(t.project_id),
                            category: t.category,
                            notes: str(t.notes),
                          }}
                        />
                        <DeleteButton action={deleteIncome.bind(null, t.id)} itemLabel="income" />
                      </>
                    }
                  />
                ))}
              </RecordList>
            )}
          </TabsContent>
          <TabsContent value="expenses">
            {data.expenses.length === 0 ? (
              <EmptyState compact icon={Receipt} title="No expenses yet" description="Track spending to see where the money goes." />
            ) : (
              <RecordList>
                {data.expenses.map((t) => (
                  <TransactionCard
                    key={t.id}
                    type="expense"
                    negative
                    title={labelFor(EXPENSE_CATEGORIES, t.category)}
                    date={t.txn_date}
                    detail={t.notes}
                    amount={Number(t.amount)}
                    currency={currency}
                    actions={
                      <>
                        <EditRecordButton
                          kind="expense"
                          id={t.id}
                          title="Edit expense"
                          initial={{ date: t.txn_date, amount: str(t.amount), category: t.category, notes: str(t.notes) }}
                        />
                        <DeleteButton action={deleteExpense.bind(null, t.id)} itemLabel="expense" />
                      </>
                    }
                  />
                ))}
              </RecordList>
            )}
          </TabsContent>
          <TabsContent value="savings">
            {data.savings.length === 0 ? (
              <EmptyState compact icon={PiggyBank} title="No savings yet" description="Pay yourself first — record a deposit." />
            ) : (
              <RecordList>
                {data.savings.map((t) => (
                  <TransactionCard
                    key={t.id}
                    type="savings"
                    negative={t.kind === "withdrawal"}
                    title={t.kind === "withdrawal" ? "Withdrawal" : "Deposit"}
                    date={t.entry_date}
                    detail={t.notes}
                    amount={Number(t.amount)}
                    currency={currency}
                    actions={
                      <>
                        <EditRecordButton
                          kind="savings"
                          id={t.id}
                          title="Edit savings entry"
                          initial={{ date: t.entry_date, amount: str(t.amount), kind: t.kind, notes: str(t.notes) }}
                        />
                        <DeleteButton action={deleteSavings.bind(null, t.id)} itemLabel="savings entry" />
                      </>
                    }
                  />
                ))}
              </RecordList>
            )}
          </TabsContent>
        </Tabs>
      </Section>
    </div>
  );
}

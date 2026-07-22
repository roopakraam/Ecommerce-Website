-- Admin dashboard metrics + revenue trend (Asia/Kolkata calendar days).
-- security definer so aggregates run once; gated by public.is_admin().

create or replace function public.admin_dashboard_metrics()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  today_start timestamptz;
  range_7d_start timestamptz;
  range_30d_start timestamptz;
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'not authorized';
  end if;

  today_start :=
    (date_trunc('day', timezone('Asia/Kolkata', now())) at time zone 'Asia/Kolkata');
  range_7d_start := today_start - interval '6 days';
  range_30d_start := today_start - interval '29 days';

  return json_build_object(
    'revenue_today',
    coalesce(
      (
        select sum(o.total)
        from public.orders o
        where o.payment_status = 'paid'
          and o.created_at >= today_start
      ),
      0
    ),
    'revenue_7d',
    coalesce(
      (
        select sum(o.total)
        from public.orders o
        where o.payment_status = 'paid'
          and o.created_at >= range_7d_start
      ),
      0
    ),
    'revenue_30d',
    coalesce(
      (
        select sum(o.total)
        from public.orders o
        where o.payment_status = 'paid'
          and o.created_at >= range_30d_start
      ),
      0
    ),
    'orders_today',
    (
      select count(*)::int
      from public.orders o
      where o.created_at >= today_start
    ),
    'low_stock_count',
    (
      select count(*)::int
      from public.product_variants pv
      where pv.stock_quantity < 5
    ),
    'new_customers',
    (
      select count(*)::int
      from public.customers c
      where c.created_at >= today_start
    )
  );
end;
$$;

create or replace function public.admin_dashboard_revenue_trend(p_days integer default 30)
returns table (day date, revenue numeric)
language plpgsql
security definer
set search_path = public
as $$
declare
  today_ist date;
  range_start date;
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'not authorized';
  end if;

  if p_days is null or p_days < 1 or p_days > 90 then
    raise exception 'p_days must be between 1 and 90';
  end if;

  today_ist := (timezone('Asia/Kolkata', now()))::date;
  range_start := today_ist - (p_days - 1);

  return query
  with days as (
    select generate_series(range_start, today_ist, interval '1 day')::date as day
  ),
  paid as (
    select
      (timezone('Asia/Kolkata', o.created_at))::date as day,
      sum(o.total) as revenue
    from public.orders o
    where o.payment_status = 'paid'
      and (timezone('Asia/Kolkata', o.created_at))::date >= range_start
      and (timezone('Asia/Kolkata', o.created_at))::date <= today_ist
    group by 1
  )
  select
    d.day,
    coalesce(p.revenue, 0)::numeric as revenue
  from days d
  left join paid p on p.day = d.day
  order by d.day;
end;
$$;

revoke all on function public.admin_dashboard_metrics() from public;
revoke all on function public.admin_dashboard_revenue_trend(integer) from public;

grant execute on function public.admin_dashboard_metrics() to authenticated;
grant execute on function public.admin_dashboard_revenue_trend(integer) to authenticated;

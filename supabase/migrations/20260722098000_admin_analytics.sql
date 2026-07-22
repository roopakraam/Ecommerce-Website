-- Admin analytics aggregations (Asia/Kolkata calendar days).
-- security definer; gated by public.is_admin().

create or replace function public.admin_analytics_sales(p_days integer default 30)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  today_ist date;
  range_start date;
  range_start_ts timestamptz;
  result json;
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'not authorized';
  end if;

  if p_days is null or p_days < 1 or p_days > 90 then
    raise exception 'p_days must be between 1 and 90';
  end if;

  today_ist := (timezone('Asia/Kolkata', now()))::date;
  range_start := today_ist - (p_days - 1);
  range_start_ts := (range_start::timestamp at time zone 'Asia/Kolkata');

  select json_build_object(
    'revenue_total',
    coalesce((
      select sum(o.total)
      from public.orders o
      where o.payment_status = 'paid'
        and o.created_at >= range_start_ts
    ), 0),
    'orders_count',
    (
      select count(*)::int
      from public.orders o
      where o.payment_status = 'paid'
        and o.created_at >= range_start_ts
    ),
    'aov',
    coalesce((
      select avg(o.total)
      from public.orders o
      where o.payment_status = 'paid'
        and o.created_at >= range_start_ts
    ), 0),
    'revenue_trend',
    coalesce((
      with days as (
        select generate_series(range_start, today_ist, interval '1 day')::date as day
      ),
      paid as (
        select
          (timezone('Asia/Kolkata', o.created_at))::date as day,
          sum(o.total) as revenue,
          count(*)::int as orders
        from public.orders o
        where o.payment_status = 'paid'
          and (timezone('Asia/Kolkata', o.created_at))::date >= range_start
          and (timezone('Asia/Kolkata', o.created_at))::date <= today_ist
        group by 1
      )
      select json_agg(
        json_build_object(
          'day', d.day,
          'revenue', coalesce(p.revenue, 0),
          'orders', coalesce(p.orders, 0)
        )
        order by d.day
      )
      from days d
      left join paid p on p.day = d.day
    ), '[]'::json),
    'top_products',
    coalesce((
      select json_agg(row_to_json(t) order by t.revenue desc)
      from (
        select
          coalesce(oi.product_id::text, oi.product_name_snapshot) as product_key,
          oi.product_id,
          oi.product_name_snapshot as name,
          sum(oi.quantity)::int as units,
          sum(oi.unit_price * oi.quantity) as revenue
        from public.order_items oi
        join public.orders o on o.id = oi.order_id
        where o.payment_status = 'paid'
          and o.created_at >= range_start_ts
        group by oi.product_id, oi.product_name_snapshot
        order by revenue desc
        limit 8
      ) t
    ), '[]'::json)
  ) into result;

  return result;
end;
$$;

create or replace function public.admin_analytics_inventory(p_days integer default 30)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  range_start_ts timestamptz;
  result json;
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'not authorized';
  end if;

  if p_days is null or p_days < 1 or p_days > 180 then
    raise exception 'p_days must be between 1 and 180';
  end if;

  range_start_ts :=
    ((timezone('Asia/Kolkata', now()))::date - (p_days - 1))::timestamp
      at time zone 'Asia/Kolkata';

  select json_build_object(
    'turnover',
    coalesce((
      select json_agg(row_to_json(t) order by t.turnover_ratio desc)
      from (
        select
          pv.id as variant_id,
          pv.sku,
          p.name as product_name,
          pv.size,
          pv.color,
          pv.stock_quantity as stock,
          coalesce(sold.units_sold, 0)::int as units_sold,
          round(
            coalesce(sold.units_sold, 0)::numeric
              / greatest(pv.stock_quantity, 1),
            2
          ) as turnover_ratio
        from public.product_variants pv
        join public.products p on p.id = pv.product_id
        left join (
          select
            oi.variant_id,
            sum(oi.quantity) as units_sold
          from public.order_items oi
          join public.orders o on o.id = oi.order_id
          where o.payment_status = 'paid'
            and o.created_at >= range_start_ts
            and oi.variant_id is not null
          group by oi.variant_id
        ) sold on sold.variant_id = pv.id
        where pv.is_active = true
        order by turnover_ratio desc, units_sold desc
        limit 12
      ) t
    ), '[]'::json),
    'dead_stock',
    coalesce((
      select json_agg(row_to_json(t) order by t.stock desc)
      from (
        select
          pv.id as variant_id,
          pv.sku,
          p.name as product_name,
          pv.size,
          pv.color,
          pv.stock_quantity as stock,
          max(o.created_at) as last_sold_at
        from public.product_variants pv
        join public.products p on p.id = pv.product_id
        left join public.order_items oi on oi.variant_id = pv.id
        left join public.orders o
          on o.id = oi.order_id
         and o.payment_status = 'paid'
        where pv.stock_quantity > 0
          and pv.is_active = true
        group by pv.id, pv.sku, p.name, pv.size, pv.color, pv.stock_quantity
        having
          max(o.created_at) is null
          or max(o.created_at) < (now() - interval '90 days')
        order by pv.stock_quantity desc
        limit 20
      ) t
    ), '[]'::json)
  ) into result;

  return result;
end;
$$;

create or replace function public.admin_analytics_customers(p_months integer default 6)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  result json;
  customers_with_orders int;
  customers_with_repeat int;
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'not authorized';
  end if;

  if p_months is null or p_months < 1 or p_months > 24 then
    raise exception 'p_months must be between 1 and 24';
  end if;

  select
    count(*)::int,
    count(*) filter (where order_count >= 2)::int
  into customers_with_orders, customers_with_repeat
  from (
    select customer_id, count(*) as order_count
    from public.orders
    where payment_status = 'paid'
    group by customer_id
  ) s;

  select json_build_object(
    'customers_with_orders', coalesce(customers_with_orders, 0),
    'customers_with_repeat', coalesce(customers_with_repeat, 0),
    'repeat_purchase_rate',
    case
      when coalesce(customers_with_orders, 0) = 0 then 0
      else round(
        customers_with_repeat::numeric / customers_with_orders::numeric,
        4
      )
    end,
    'new_vs_returning',
    coalesce((
      with months as (
        select
          to_char(
            date_trunc(
              'month',
              (timezone('Asia/Kolkata', now()))::date - (n || ' months')::interval
            ),
            'YYYY-MM'
          ) as period
        from generate_series(0, p_months - 1) as g(n)
      ),
      first_orders as (
        select
          o.customer_id,
          min((timezone('Asia/Kolkata', o.created_at))::date) as first_order_day
        from public.orders o
        where o.payment_status = 'paid'
        group by o.customer_id
      ),
      month_orders as (
        select
          to_char(timezone('Asia/Kolkata', o.created_at), 'YYYY-MM') as period,
          o.customer_id,
          fo.first_order_day
        from public.orders o
        join first_orders fo on fo.customer_id = o.customer_id
        where o.payment_status = 'paid'
          and timezone('Asia/Kolkata', o.created_at) >=
            date_trunc(
              'month',
              (timezone('Asia/Kolkata', now()))::date
                - ((p_months - 1) || ' months')::interval
            )
      )
      select json_agg(
        json_build_object(
          'period', m.period,
          'new', coalesce(agg.new_count, 0),
          'returning', coalesce(agg.returning_count, 0)
        )
        order by m.period
      )
      from months m
      left join (
        select
          period,
          count(distinct customer_id) filter (
            where to_char(first_order_day, 'YYYY-MM') = period
          )::int as new_count,
          count(distinct customer_id) filter (
            where to_char(first_order_day, 'YYYY-MM') <> period
          )::int as returning_count
        from month_orders
        group by period
      ) agg on agg.period = m.period
    ), '[]'::json),
    'cohorts',
    coalesce((
      with first_orders as (
        select
          o.customer_id,
          to_char(min(timezone('Asia/Kolkata', o.created_at)), 'YYYY-MM') as cohort_month
        from public.orders o
        where o.payment_status = 'paid'
        group by o.customer_id
      ),
      cohorts as (
        select
          cohort_month,
          count(*)::int as customers
        from first_orders
        where cohort_month >= to_char(
          date_trunc(
            'month',
            (timezone('Asia/Kolkata', now()))::date
              - ((p_months - 1) || ' months')::interval
          ),
          'YYYY-MM'
        )
        group by cohort_month
      ),
      repeats as (
        select
          fo.cohort_month,
          count(distinct fo.customer_id)::int as repeat_customers
        from first_orders fo
        join public.orders o on o.customer_id = fo.customer_id
        where o.payment_status = 'paid'
          and to_char(timezone('Asia/Kolkata', o.created_at), 'YYYY-MM')
            > fo.cohort_month
        group by fo.cohort_month
      )
      select json_agg(
        json_build_object(
          'cohort_month', c.cohort_month,
          'customers', c.customers,
          'repeat_customers', coalesce(r.repeat_customers, 0),
          'repeat_rate',
          case
            when c.customers = 0 then 0
            else round(
              coalesce(r.repeat_customers, 0)::numeric / c.customers::numeric,
              4
            )
          end
        )
        order by c.cohort_month
      )
      from cohorts c
      left join repeats r on r.cohort_month = c.cohort_month
    ), '[]'::json)
  ) into result;

  return result;
end;
$$;

revoke all on function public.admin_analytics_sales(integer) from public;
revoke all on function public.admin_analytics_inventory(integer) from public;
revoke all on function public.admin_analytics_customers(integer) from public;

grant execute on function public.admin_analytics_sales(integer) to authenticated;
grant execute on function public.admin_analytics_inventory(integer) to authenticated;
grant execute on function public.admin_analytics_customers(integer) to authenticated;

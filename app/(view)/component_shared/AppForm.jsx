'use client';

import React, { useCallback, useEffect, useMemo } from 'react';
import { Form, DatePicker, TimePicker, Switch, Checkbox, Radio, Upload, Divider } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import clsx from 'classnames';

import AppInput from './AppInput';
import AppSelect from './AppSelect';
import AppButton from './AppButton';
import AppGrid from './AppGrid';
import AppSpace from './AppSpace';
import AppTypography from './AppTypography';
import AppCard from './AppCard';
import { fontBodyClassName, fontFamily } from './Font';
import './AppForm.css';

export const useAppForm = Form.useForm;
export const useAppWatch = Form.useWatch;

function Bool(v) {
  return Boolean(v);
}

function mergeClassNames(...parts) {
  return parts.filter(Boolean).join(' ');
}

function isNil(v) {
  return v == null;
}

function resolveMaybeFn(v, ctx) {
  return typeof v === 'function' ? v(ctx) : v;
}

function normalizeNamePath(name) {
  if (Array.isArray(name)) return name;
  if (typeof name === 'string') return name.split('.').filter(Boolean);
  if (typeof name === 'number') return [name];
  return [];
}

function getIn(obj, path) {
  if (!obj) return undefined;
  let cur = obj;
  for (const k of path) {
    if (cur == null) return undefined;
    cur = cur[k];
  }
  return cur;
}

function shallowEqual(a, b) {
  if (Object.is(a, b)) return true;
  if (typeof a !== typeof b) return false;
  if (a && b && typeof a === 'object') {
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    if (aKeys.length !== bKeys.length) return false;
    for (const k of aKeys) {
      if (!Object.prototype.hasOwnProperty.call(b, k)) return false;
      if (!Object.is(a[k], b[k])) return false;
    }
    return true;
  }
  return false;
}

function normalizeOptions(options, optionLabelKey = 'label', optionValueKey = 'value') {
  if (!options) return [];
  if (Array.isArray(options)) {
    return options
      .map((it) => {
        if (typeof it === 'string' || typeof it === 'number') return { label: String(it), value: it };
        if (it && typeof it === 'object') {
          const label = it.label ?? it[optionLabelKey] ?? it.name ?? it.title ?? String(it[optionValueKey] ?? it.value ?? '');
          const value = it.value ?? it[optionValueKey] ?? it.id ?? it.key ?? label;
          return { ...it, label, value };
        }
        return null;
      })
      .filter(Bool);
  }
  return [];
}

function resolveOptions(field, ctx) {
  const options = resolveMaybeFn(field.options, ctx);
  const optionLabelKey = field.optionLabelKey ?? 'label';
  const optionValueKey = field.optionValueKey ?? 'value';
  return normalizeOptions(options, optionLabelKey, optionValueKey);
}

function pickFormItemProps(field, ctx, name, parentNamePath) {
  const itemProps = resolveMaybeFn(field.itemProps, ctx) || {};
  const label = resolveMaybeFn(field.label, ctx);
  const extra = resolveMaybeFn(field.extra, ctx);
  const tooltip = resolveMaybeFn(field.tooltip, ctx);
  const hidden = Boolean(resolveMaybeFn(field.hidden, ctx));

  const rules = resolveMaybeFn(field.rules, ctx);
  const dependencies = resolveMaybeFn(field.dependencies, ctx);
  const validateTrigger = resolveMaybeFn(field.validateTrigger, ctx);
  const validateFirst = resolveMaybeFn(field.validateFirst, ctx);
  const validateDebounce = resolveMaybeFn(field.validateDebounce, ctx);
  const validateStatus = resolveMaybeFn(field.validateStatus, ctx);
  const hasFeedback = resolveMaybeFn(field.hasFeedback, ctx);
  const help = resolveMaybeFn(field.help, ctx);
  const initialValue = resolveMaybeFn(field.initialValue, ctx);
  const valuePropName = resolveMaybeFn(field.valuePropName, ctx);
  const getValueFromEvent = resolveMaybeFn(field.getValueFromEvent, ctx);
  const getValueProps = resolveMaybeFn(field.getValueProps, ctx);
  const messageVariables = resolveMaybeFn(field.messageVariables, ctx);
  const noStyle = resolveMaybeFn(field.noStyle, ctx);
  const required = resolveMaybeFn(field.required, ctx);
  const shouldUpdate = resolveMaybeFn(field.shouldUpdate, ctx);

  const normalize = resolveMaybeFn(field.normalize, ctx);
  const preserve = resolveMaybeFn(field.preserve, ctx);
  const validate = resolveMaybeFn(field.validate, ctx);
  const trigger = resolveMaybeFn(field.trigger, ctx);
  const validateOn = resolveMaybeFn(field.validateOn, ctx);

  const fullName = parentNamePath?.length ? [...parentNamePath, ...normalizeNamePath(name)] : normalizeNamePath(name);

  return {
    name: fullName.length ? fullName : name,
    label,
    extra,
    tooltip,
    hidden,
    rules,
    dependencies,
    validateTrigger,
    validateFirst,
    validateDebounce,
    validateStatus,
    hasFeedback,
    help,
    initialValue,
    valuePropName,
    getValueFromEvent,
    getValueProps,
    messageVariables,
    noStyle,
    required,
    shouldUpdate,
    normalize,
    preserve,
    validate,
    trigger,
    validateOn,
    ...itemProps,
  };
}

function SectionBlock({ field, ctx, children }) {
  const title = resolveMaybeFn(field.title, ctx);
  const subtitle = resolveMaybeFn(field.subtitle, ctx);
  const card = resolveMaybeFn(field.card, ctx);
  const className = resolveMaybeFn(field.className, ctx);
  const headerExtra = resolveMaybeFn(field.headerExtra, ctx);

  const content = <div className={clsx(field.contentClassName, field.noPadding ? '' : 'space-y-3')}>{children}</div>;

  if (card) {
    return (
      <AppCard
        className={className}
        title={title}
        subtitle={subtitle}
        headerExtra={headerExtra}
      >
        {content}
      </AppCard>
    );
  }

  return (
    <div className={className}>
      {title || subtitle || headerExtra ? (
        <div className='mb-3 flex items-start justify-between gap-3'>
          <div className='min-w-0'>
            {title ? (
              <AppTypography.Title
                level={5}
                className='m-0'
              >
                {title}
              </AppTypography.Title>
            ) : null}
            {subtitle ? (
              <AppTypography.Text
                type='secondary'
                className='block'
              >
                {subtitle}
              </AppTypography.Text>
            ) : null}
          </div>
          {headerExtra ? <div className='flex-shrink-0'>{headerExtra}</div> : null}
        </div>
      ) : null}
      {content}
    </div>
  );
}

function TitleBlock({ field, ctx }) {
  const title = resolveMaybeFn(field.title, ctx);
  const subtitle = resolveMaybeFn(field.subtitle, ctx);
  const className = resolveMaybeFn(field.className, ctx);

  return (
    <div className={className}>
      {title ? (
        <AppTypography.Title
          level={4}
          className='m-0'
        >
          {title}
        </AppTypography.Title>
      ) : null}
      {subtitle ? (
        <AppTypography.Text
          type='secondary'
          className='block mt-1'
        >
          {subtitle}
        </AppTypography.Text>
      ) : null}
    </div>
  );
}

function GroupBlock({ field, ctx, children }) {
  const className = resolveMaybeFn(field.className, ctx);
  const direction = resolveMaybeFn(field.direction, ctx) ?? 'vertical';
  const size = resolveMaybeFn(field.size, ctx) ?? 12;
  const align = resolveMaybeFn(field.align, ctx);
  const wrap = resolveMaybeFn(field.wrap, ctx);
  return (
    <AppSpace
      className={className}
      direction={direction}
      size={size}
      align={align}
      wrap={wrap}
      style={resolveMaybeFn(field.style, ctx)}
    >
      {children}
    </AppSpace>
  );
}

function ListBlock({ field, ctx, children }) {
  const className = resolveMaybeFn(field.className, ctx);
  const style = resolveMaybeFn(field.style, ctx);
  const spacing = resolveMaybeFn(field.spacing, ctx) ?? 12;
  return (
    <div
      className={className}
      style={{
        display: 'grid',
        rowGap: spacing,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export default function AppForm({
  fields = [],
  form,
  initialValues,
  onFinish,
  onFinishFailed,
  onValuesChange,
  onFieldsChange,

  layout = 'vertical',
  requiredMark = false,

  disabled = false,
  loading = false,

  showSubmit = true,
  submitText = 'Submit',
  submitVariant = 'primary',
  submitProps = {},

  footer,
  formProps = {},
  rowGutter = [16, 16],

  className,
  style,

  useGoogleFont = true,
  fontClassNameOverride,

  transformOnFinish,

  context,
  formRef,
  apiRef,
  onFormReady,
  onApiReady,
}) {
  const [usedForm] = Form.useForm(form);

  const ctxBase = useMemo(() => {
    const setValue = (name, value) => usedForm.setFieldValue(name, value);
    const base = {
      form: usedForm,
      disabled,
      loading,
      reset: () => usedForm.resetFields(),
      submit: () => usedForm.submit(),
      getValue: (name) => usedForm.getFieldValue(name),
      getValues: () => usedForm.getFieldsValue(true),
      setValue,
      setValues: (vals) => usedForm.setFieldsValue(vals),
    };
    const extra = typeof context === 'function' ? context(base) : context;
    if (extra && typeof extra === 'object') return { ...base, ...extra };
    return base;
  }, [usedForm, disabled, loading, context]);

  const setRefValue = useCallback((ref, value) => {
    if (!ref) return;
    if (typeof ref === 'function') {
      ref(value);
      return;
    }
    if (typeof ref === 'object') {
      ref.current = value;
    }
  }, []);

  useEffect(() => {
    setRefValue(formRef, usedForm);
    if (typeof onFormReady === 'function') onFormReady(usedForm);
  }, [setRefValue, formRef, onFormReady, usedForm]);

  useEffect(() => {
    setRefValue(apiRef, ctxBase);
    if (typeof onApiReady === 'function') onApiReady(ctxBase);
  }, [setRefValue, apiRef, onApiReady, ctxBase]);

  const resolvedFontClass = fontClassNameOverride ? fontClassNameOverride : useGoogleFont ? fontBodyClassName : '';
  const resolvedFormClassName = mergeClassNames(useGoogleFont ? 'form-google-font' : '', resolvedFontClass, className);

  const resolvedStyle = useGoogleFont ? { '--app-form-font': fontFamily, fontFamily, ...(style || {}) } : style;

  const computeShouldUpdate = useCallback((field, ctx) => {
    const custom = resolveMaybeFn(field.shouldUpdate, ctx);
    if (typeof custom === 'function') return (prev, cur) => custom(prev, cur, ctx);

    const watch = resolveMaybeFn(field.watch, ctx);
    const deps = Array.isArray(watch) ? watch : Array.isArray(field.rerenderOn) ? field.rerenderOn : null;
    const paths = (deps || []).map((d) => normalizeNamePath(d));

    if (!paths.length) return true;

    return (prev, cur) => {
      for (const p of paths) {
        const a = getIn(prev, p);
        const b = getIn(cur, p);
        if (!shallowEqual(a, b)) return true;
      }
      return false;
    };
  }, []);

  function buildColProps(field, ctx) {
    const col = resolveMaybeFn(field.col, ctx);
    if (col) return col;

    const span = resolveMaybeFn(field.span, ctx);
    if (!isNil(span)) return { xs: 24, md: span };

    return undefined;
  }

  function renderControl(field, ctx) {
    const { type = 'text', placeholder, size = 'middle', allowClear = true, prefix, suffix, prefixIcon, suffixIcon, controlProps = {} } = field;

    const resolvedDisabled = Boolean(resolveMaybeFn(field.disabled, ctx)) || disabled || loading;
    const resolvedPrefix = prefixIcon ?? prefix;
    const resolvedSuffix = suffixIcon ?? suffix;

    const rawControlProps = resolveMaybeFn(controlProps, ctx) || {};
    const mergedControlProps = { ...rawControlProps };

    if (type === 'custom') {
      const comp = field.component;
      if (typeof comp === 'function') return comp(ctx);
      return comp ?? null;
    }

    if (typeof field.render === 'function') {
      return field.render(ctx);
    }

    if (type === 'select' || type === 'multiselect' || type === 'tags') {
      const mode = field.mode ?? mergedControlProps.mode ?? (type === 'multiselect' ? 'multiple' : type === 'tags' ? 'tags' : undefined);
      const opts = mergedControlProps.options ?? resolveOptions(field, ctx);

      return (
        <AppSelect
          {...mergedControlProps}
          mode={mode}
          options={opts}
          size={size}
          disabled={resolvedDisabled}
          allowClear={mergedControlProps.allowClear ?? allowClear}
          placeholder={placeholder}
        />
      );
    }

    if (type === 'textarea') {
      return (
        <AppInput.TextArea
          {...mergedControlProps}
          size={size}
          allowClear={mergedControlProps.allowClear ?? allowClear}
          placeholder={placeholder}
          disabled={resolvedDisabled}
          prefixIcon={resolvedPrefix}
          suffixIcon={resolvedSuffix}
        />
      );
    }

    if (type === 'password') {
      return (
        <AppInput.Password
          size={size}
          allowClear={allowClear}
          placeholder={placeholder}
          disabled={resolvedDisabled}
          prefixIcon={resolvedPrefix}
          suffixIcon={resolvedSuffix}
          {...mergedControlProps}
        />
      );
    }

    if (type === 'number') {
      return (
        <AppInput.Number
          size={size}
          allowClear={allowClear}
          placeholder={placeholder}
          disabled={resolvedDisabled}
          prefixIcon={resolvedPrefix}
          suffixIcon={resolvedSuffix}
          {...mergedControlProps}
        />
      );
    }

    if (type === 'switch') {
      return (
        <Switch
          {...mergedControlProps}
          disabled={resolvedDisabled}
        />
      );
    }

    if (type === 'checkbox') {
      const label = resolveMaybeFn(field.checkboxLabel, ctx);
      return (
        <Checkbox
          {...mergedControlProps}
          disabled={resolvedDisabled}
        >
          {label}
        </Checkbox>
      );
    }

    if (type === 'checkbox-group') {
      const opts = mergedControlProps.options ?? resolveOptions(field, ctx);
      return (
        <Checkbox.Group
          {...mergedControlProps}
          disabled={resolvedDisabled}
          options={opts}
        />
      );
    }

    if (type === 'radio-group') {
      const opts = mergedControlProps.options ?? resolveOptions(field, ctx);
      return (
        <Radio.Group
          {...mergedControlProps}
          disabled={resolvedDisabled}
          options={opts}
        />
      );
    }

    if (type === 'time') {
      const pickerProps = {
        ...mergedControlProps,
        className: clsx('sp-form-picker', mergedControlProps.className),
        disabled: resolvedDisabled,
        placeholder,
      };
      return <TimePicker {...pickerProps} />;
    }

    if (type === 'date' || type === 'datetime') {
      const pickerProps = {
        ...mergedControlProps,
        className: clsx('sp-form-picker', mergedControlProps.className),
        disabled: resolvedDisabled,
        placeholder,
      };

      return (
        <DatePicker
          {...pickerProps}
          showTime={type === 'datetime' ? pickerProps.showTime ?? true : pickerProps.showTime}
          placeholder={placeholder}
        />
      );
    }

    if (type === 'upload') {
      const { listType = 'text', maxCount, accept, multiple, beforeUpload, action, headers, data } = mergedControlProps;

      const buttonText = resolveMaybeFn(field.uploadText, ctx) ?? 'Upload';
      const buttonIcon = resolveMaybeFn(field.uploadIcon, ctx) ?? <UploadOutlined />;

      return (
        <Upload
          listType={listType}
          maxCount={maxCount}
          accept={accept}
          multiple={multiple}
          beforeUpload={beforeUpload}
          action={action}
          headers={headers}
          data={data}
          disabled={resolvedDisabled}
          {...mergedControlProps}
        >
          <AppButton
            variant={field.uploadVariant ?? 'outline'}
            icon={buttonIcon}
            disabled={resolvedDisabled}
          >
            {buttonText}
          </AppButton>
        </Upload>
      );
    }

    return (
      <AppInput
        size={size}
        allowClear={allowClear}
        placeholder={placeholder}
        disabled={resolvedDisabled}
        prefixIcon={resolvedPrefix}
        suffixIcon={resolvedSuffix}
        {...mergedControlProps}
      />
    );
  }

  function renderOneField(field, idx, parentKey, parentNamePath) {
    if (!field || typeof field !== 'object') return null;

    const key = field.key || `${parentKey || 'f'}-${idx}-${Array.isArray(field.name) ? field.name.join('.') : field.name || field.type || 'x'}`;

    if (field.type === 'divider') {
      const ctx = { ...ctxBase, values: ctxBase.getValues() };
      const hidden = Boolean(resolveMaybeFn(field.hidden, ctx));
      if (hidden) return null;

      const text = resolveMaybeFn(field.text, ctx);
      return (
        <Divider
          key={key}
          {...(resolveMaybeFn(field.props, ctx) || {})}
        >
          {text}
        </Divider>
      );
    }

    if (field.type === 'title') {
      const ctx = { ...ctxBase, values: ctxBase.getValues() };
      const hidden = Boolean(resolveMaybeFn(field.hidden, ctx));
      if (hidden) return null;
      return (
        <TitleBlock
          key={key}
          field={field}
          ctx={ctx}
        />
      );
    }

    if (field.type === 'section') {
      const ctx = { ...ctxBase, values: ctxBase.getValues() };
      const hidden = Boolean(resolveMaybeFn(field.hidden, ctx));
      if (hidden) return null;

      const children = Array.isArray(field.children) ? field.children : [];
      return (
        <SectionBlock
          key={key}
          field={field}
          ctx={ctx}
        >
          {children.map((c, i) => renderOneField(c, i, key, parentNamePath))}
        </SectionBlock>
      );
    }

    if (field.type === 'row') {
      const ctx = { ...ctxBase, values: ctxBase.getValues() };
      const hidden = Boolean(resolveMaybeFn(field.hidden, ctx));
      if (hidden) return null;

      const gutter = resolveMaybeFn(field.gutter, ctx) ?? rowGutter;
      const cols = Array.isArray(field.children) ? field.children : [];
      return (
        <AppGrid.Row
          key={key}
          gutter={gutter}
          className={resolveMaybeFn(field.className, ctx)}
          style={resolveMaybeFn(field.style, ctx)}
        >
          {cols.map((c, i) => {
            const colProps = buildColProps(c, ctx);
            const node = renderOneField(c, i, key, parentNamePath);
            if (!node) return null;
            return (
              <AppGrid.Col
                key={`${key}-c-${i}`}
                {...(colProps || { xs: 24 })}
              >
                {node}
              </AppGrid.Col>
            );
          })}
        </AppGrid.Row>
      );
    }

    if (field.type === 'group') {
      const ctx = { ...ctxBase, values: ctxBase.getValues() };
      const hidden = Boolean(resolveMaybeFn(field.hidden, ctx));
      if (hidden) return null;

      const children = Array.isArray(field.children) ? field.children : [];
      return (
        <GroupBlock
          key={key}
          field={field}
          ctx={ctx}
        >
          {children.map((c, i) => renderOneField(c, i, key, parentNamePath))}
        </GroupBlock>
      );
    }

    if (field.type === 'list') {
      const ctx = { ...ctxBase, values: ctxBase.getValues() };
      const hidden = Boolean(resolveMaybeFn(field.hidden, ctx));
      if (hidden) return null;

      const children = Array.isArray(field.children) ? field.children : [];
      return (
        <ListBlock
          key={key}
          field={field}
          ctx={ctx}
        >
          {children.map((c, i) => renderOneField(c, i, key, parentNamePath))}
        </ListBlock>
      );
    }

    const dynamic =
      Boolean(resolveMaybeFn(field.dynamic, { ...ctxBase, values: ctxBase.getValues() })) ||
      Boolean(resolveMaybeFn(field.watch, { ...ctxBase, values: ctxBase.getValues() })) ||
      Boolean(resolveMaybeFn(field.rerenderOn, { ...ctxBase, values: ctxBase.getValues() }));

    const renderActual = () => {
      const ctx = { ...ctxBase, values: ctxBase.getValues() };
      const hidden = Boolean(resolveMaybeFn(field.hidden, ctx));
      if (hidden) return null;

      const name = resolveMaybeFn(field.name, ctx);
      const item = pickFormItemProps(field, ctx, name, parentNamePath);

      const control = typeof field.render === 'function' ? field.render(ctx) : renderControl(field, ctx);

      if (field.noItem) return <React.Fragment key={key}>{control}</React.Fragment>;

      return (
        <Form.Item
          key={key}
          {...item}
        >
          {control}
        </Form.Item>
      );
    };

    if (!dynamic) return renderActual();

    const ctx = { ...ctxBase, values: ctxBase.getValues() };
    const shouldUpdateFn = computeShouldUpdate(field, ctx);

    return (
      <Form.Item
        key={`${key}-dyn`}
        noStyle
        shouldUpdate={shouldUpdateFn}
      >
        {() => renderActual()}
      </Form.Item>
    );
  }

  function renderFields(input) {
    const ctx = { ...ctxBase, values: ctxBase.getValues() };
    const resolved = typeof input === 'function' ? input(ctx) : input;
    const arr = Array.isArray(resolved) ? resolved : [];
    return arr.map((f, i) => renderOneField(f, i));
  }

  const footerNode =
    typeof footer === 'function'
      ? footer({ ...ctxBase, values: ctxBase.getValues() })
      : footer ??
        (showSubmit ? (
          <AppButton
            variant={submitVariant}
            htmlType='submit'
            block
            loading={loading}
            disabled={disabled}
            {...submitProps}
          >
            {submitText}
          </AppButton>
        ) : null);

  return (
    <Form
      form={usedForm}
      layout={layout}
      requiredMark={requiredMark}
      disabled={disabled}
      initialValues={initialValues}
      className={resolvedFormClassName}
      style={resolvedStyle}
      onFinish={async (values) => {
        const ctx = { ...ctxBase, values };
        const nextValues = typeof transformOnFinish === 'function' ? await transformOnFinish(values, ctx) : values;
        return onFinish?.(nextValues);
      }}
      onFinishFailed={onFinishFailed}
      onValuesChange={onValuesChange}
      onFieldsChange={onFieldsChange}
      {...formProps}
    >
      {renderFields(fields)}
      {footerNode ? <div className='mt-4'>{footerNode}</div> : null}
    </Form>
  );
}

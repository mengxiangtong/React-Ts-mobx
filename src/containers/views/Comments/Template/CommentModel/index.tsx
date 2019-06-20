import * as React from 'react'
import { inject, observer } from 'mobx-react'
import { observable, action, computed, runInAction } from 'mobx'
import { Form, Input, Button, message, Upload, Icon as AntIcon, Popover, Col, Radio, Select} from 'antd'
import { FormComponentProps } from 'antd/lib/form'
import { ComponentExt } from '@utils/reactExt'
import * as styles from './index.scss'
import EmojiPicker from '@components/Emoji'
import * as web from '../web.config'
// 封装表单域组件
const FormItem = Form.Item

const formItemLayout = {
    labelCol: {
        xs: { span: 24 },
        sm: { span: 8 },
        lg: { span: 6 }
    },
    wrapperCol: {
        xs: { span: 24 },
        sm: { span: 15 },
        lg: { span: 6 }
    }
}
const formItemLayoutForModel = {
    labelCol: {
        xs: { span: 24 },
        sm: { span: 5 },
        lg: { span: 10 },
    },
    wrapperCol: {
        xs: { span: 24 },
        sm: { span: 13 },
        lg: { span: 13 }
    }
}

interface hasResult {
    result?: string
}

interface IStoreProps {
    comment?: ICommentStore.IComment
    createComment?: (company: ICommentStore.IComment) => Promise<any>
    modifyComment?: (company: ICommentStore.IComment) => Promise<any>
    getOptionListDb?: ({}) => Promise<any>
    changepage?: (page: number) => void
    routerStore?: RouterStore
    clearComment?: () => void
    optionListDb?: ICommentStore.OptionListDb
}

interface IProps extends IStoreProps {
    type?: string
    onOk?: (id: string) => void
    onCancel?: () => void
}

@inject(
    (store: IStore): IProps => {
        const { commentStore, routerStore } = store
        const { comment, createComment, modifyComment, clearComment, getOptionListDb, optionListDb } = commentStore
        return { clearComment, comment, routerStore, createComment, modifyComment, getOptionListDb, optionListDb }
    }
)
@observer
class CommentModal extends ComponentExt<IProps & FormComponentProps> {
    @observable
    private loading: boolean = false

    @observable
    private emoji: boolean = false

    @observable
    private head_portrait: string

    @computed
    get formItemLayout() {
        return this.props.type ? formItemLayoutForModel : formItemLayout
    }

    @computed
    get isAdd() {
        return !this.props.comment
    }

    @computed
    get buttonModalLayout() {
        return this.props.type ? 'btnBox' : ''
    }

    @action
    toggleLoading = () => {
        this.loading = !this.loading
    }

    @action
    showEmojiPicker = () => {
        this.emoji = !this.emoji
    }

    @action
    removeFile = () => {
        runInAction('SET_URL', () => {
            this.head_portrait = ''
        })
        this.props.form.setFieldsValue({
            head_portrait: ''
        })
    }

    @action
    languageChange = (language) => {
        this.props.form.setFieldsValue({
            language: `${language}`
        })
    }

    componentWillMount() {
        this.props.getOptionListDb({})
        const { routerStore, comment = {} } = this.props
        const routerId = routerStore.location.pathname.toString().split('/').pop()
        const Id = Number(routerId)
        if ((!isNaN(Id) && (!comment.id || comment.id !== Id)) && !this.props.type) {
            routerStore.push('/comments/template')
        }
    }
    componentWillUnmount() {
        this.props.clearComment()
    }

    checkImageWH = (file, width, height) => {
        return new Promise((resolve, reject) => {
            let filereader = new FileReader()
            filereader.onload = e => {
                let src = e.target as hasResult
            }
        })
    }

    submit = (e?: React.FormEvent<any>): void => {
        if (e) {
            e.preventDefault()
        }
        const { routerStore, comment, createComment, modifyComment, form } = this.props
        form.validateFields(
            async (err, values): Promise<any> => {
                if (!err) {
                    this.toggleLoading()
                    try {
                        let data = {
                            message: '',
                        }
                        values = {
                            ...values,
                        }
                        if (this.isAdd) {
                            data = await createComment(values)
                        } else {
                            data = await modifyComment({ ...values })
                        }
                        message.success(data.message)
                        if (this.props.type) {
                            // this.props.onOk(data.data.id)
                            this.props.form.resetFields()
                        } else {
                            routerStore.push('/comments/template')
                        }
                    } catch (err) {
                        console.log(err);
                    }
                    this.toggleLoading()
                }
            }
        )
    }

    setCom_talk = (e)=>{
        this.props.form.setFieldsValue({
            com_talk:e.target.innerHTML
        })
    }

    render() {
        const uploadConfig = {
            showUploadList: false,
            accept: ".png, .jpg, .jpeg, .gif",
            name: 'file',
            customRequest: (data) => {
                const formData = new FormData()
                formData.append('file', data.file)
                this.api.appGroup.uploadIcon(formData).then(res => {
                    const head_portrait = res.data.url
                    this.props.form.setFieldsValue({
                        head_portrait: head_portrait
                    })
                    const fileRender = new FileReader()
                    fileRender.onload = (ev) => {
                        const target = ev.target as hasResult
                        runInAction('SET_URL', () => {
                            this.head_portrait = target.result;
                        })
                    }
                    fileRender.readAsDataURL(data.file)
                }, this.removeFile).catch(this.removeFile)
            }

        }
        const { comment, form, optionListDb } = this.props
        const { getFieldDecorator } = form
        const {
            id = '',
            status = 1,
            language = 'en',
            head_portrait = '',
            com_name = '',
            com_talk = ''
        } = comment || {}
        return (
            <div className='sb-form'>
                <Form className={styles.CompanyModal} {...this.formItemLayout} style={{ paddingLeft: 0 }}>
                    {!this.isAdd && <FormItem label="ID"  >
                        {getFieldDecorator('id', {
                            initialValue: id,
                            rules: [
                                {
                                    required: true, message: "Required"
                                }
                            ]
                        })(<Input disabled={!this.isAdd} />)}
                    </FormItem>
                    }
                    <FormItem label="Status"  >
                        {getFieldDecorator('status', {
                            initialValue: status,
                            rules: [
                                {
                                    required: true, message: "Required"
                                }
                            ]
                        })(
                            <Radio.Group>
                                {web.statusOption.map(c => (
                                    <Radio key={c.key} value={c.value}>
                                        {c.key}
                                    </Radio>
                                ))}
                            </Radio.Group>
                        )}
                    </FormItem>
                    <FormItem label="Comment Language" >
                        {getFieldDecorator('language', {
                            initialValue: language,
                            rules: [{
                                required: true, message: "Required"
                            }
                            ]
                        })(
                            <Select
                                showSearch
                                onChange={this.languageChange}
                                filterOption={(input, option) => option.props.children.toString().toLowerCase().indexOf(input.toLowerCase()) >= 0}
                            >
                                {
                                    optionListDb.language.map(c => {
                                        <Select.Option key={c} value={c}>
                                            console.log({c})
                                            {c}
                                        </Select.Option>
                                    })
                                }
                            </Select>
                        )}
                    </FormItem>
                    <FormItem label="Head Portrait" >
                        {getFieldDecorator('head_portrait', {
                            initialValue: head_portrait,
                            rules: [
                                {
                                    required: true, message: "Required"
                                }
                            ],
                        })(<Upload {...uploadConfig}>
                            {this.head_portrait || head_portrait ? <img width="80" height="80" src={this.head_portrait || head_portrait} alt="avatar" /> : <AntIcon className={styles.workPlus} type='plus' />}
                        </Upload>)}
                    </FormItem>
                    <FormItem label="Comment Name" >
                        {getFieldDecorator('com_name', {
                            initialValue: com_name,
                            rules: [
                                {
                                    required: true, message: "Required"
                                }
                            ],
                            validateTrigger: 'onBlur'
                        })(<Input />)}
                    </FormItem>
                    <FormItem label="Comment Talk" >
                        {getFieldDecorator('com_talk', {
                            initialValue: com_talk,
                            rules: [
                                {
                                    required: true, message: 'required'
                                },
                            ],
                        })(
                            <div>
                                <Popover 
                                    content={<EmojiPicker></EmojiPicker>}
                                    trigger="click"
                                    visible={this.emoji}
                                    placement="top">
                                    <AntIcon className={styles.workPlus} onClick={this.showEmojiPicker} type="plus" />
                                </Popover>
                                <div className={styles.textBox} onInput={this.setCom_talk} contentEditable={true}>{com_talk ? com_talk : ''}</div>
                            </div>
                        )}
                    </FormItem>
                    <FormItem className={this.props.type ? styles.modalBtn : styles.btnBox} >
                        <Button className={this.props.type ? styles.btn : ''} type="primary" loading={this.loading} onClick={this.submit}>Submit</Button>
                    </FormItem>
                </Form>

            </div>
        )
    }
}

export default Form.create<IProps>()(CommentModal)
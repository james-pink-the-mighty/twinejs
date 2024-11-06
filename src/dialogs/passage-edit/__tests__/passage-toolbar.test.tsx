import {act, fireEvent, render, screen, within} from '@testing-library/react';
import {axe} from 'jest-axe';
import * as React from 'react';
import {useStoriesContext} from '../../../store/stories';
import {
	FakeStateProvider,
	FakeStateProviderProps,
	fakeStory,
	StoryInspector
} from '../../../test-util';
import {PassageToolbar} from '../passage-toolbar';
import {usePrefsContext} from '../../../store/prefs';

jest.mock('../../../components/control/menu-button');
jest.mock('../../../components/passage/rename-passage-button');
jest.mock('../../../components/tag/add-tag-button');

const TestPassageToolbar: React.FC = () => {
	const {prefs} = usePrefsContext();
	const {stories} = useStoriesContext();

	return (
		<PassageToolbar
			passage={stories[0].passages[0]}
			story={stories[0]}
			useCodeMirror={prefs.useCodeMirror}
		/>
	);
};

describe('<PassageToolbar>', () => {
	async function renderComponent(context?: FakeStateProviderProps) {
		const result = render(
			<FakeStateProvider {...context}>
				<TestPassageToolbar />
				<StoryInspector />
			</FakeStateProvider>
		);

		// Needed because of <PromptButton>
		await act(() => Promise.resolve());
		return result;
	}

	it('adds a tag to the passage if the user adds one', async () => {
		const story = fakeStory(1);

		story.passages[0].tags = [];
		await renderComponent({stories: [story]});
		expect(
			screen.getByTestId(`passage-${story.passages[0].id}`).dataset.tags
		).toBe('');
		fireEvent.click(
			within(screen.getByTestId('mock-add-tag-button')).getByText('onAdd')
		);
		expect(
			screen.getByTestId(`passage-${story.passages[0].id}`).dataset.tags
		).toBe('mock-tag-name');
	});

	it('renames the passage if the user uses the rename button', async () => {
		const story = fakeStory(1);

		await renderComponent({stories: [story]});
		fireEvent.click(
			screen.getByText(`mock-rename-passage-button-${story.passages[0].id}`)
		);
		expect(
			screen.getByTestId(`passage-${story.passages[0].id}`).dataset.name
		).toBe('mock-new-passage-name');
	});

	it('displays a button to test the story from this passage', () => {
		renderComponent();
		expect(
			screen.getByRole('button', {
				name: 'routes.storyEdit.toolbar.testFromHere'
			})
		).toBeVisible();
	});

	// Need a higher-fidelity mock of <MenuButton> that includes checked state.

	it.todo(
		"displays a dropdown menu of sizes, with the passage's current one selected"
	);

	it.each([
		['small', 'Small', {height: 100, width: 100}],
		['large', 'Large', {height: 200, width: 200}],
		['tall', 'Tall', {height: 200, width: 100}],
		['wide', 'Wide', {height: 100, width: 200}]
	])(
		'updates the passage when its size is changed to %s',
		async (_, label, passageProps) => {
			const story = fakeStory(2);

			story.passages[0].width = 10;
			story.passages[0].height = 10;
			await renderComponent({stories: [story]});
			fireEvent.click(screen.getByText(`dialogs.passageEdit.size${label}`));

			const passage = screen.getByTestId(`passage-${story.passages[0].id}`);

			expect(passage.dataset.height).toBe(passageProps.height.toString());
			expect(passage.dataset.width).toBe(passageProps.width.toString());
		}
	);

	it('shows undo and redo buttons if CodeMirror is enabled in preferences', () => {
		renderComponent({prefs: {useCodeMirror: true}});
		expect(
			screen.getByRole('button', {name: 'common.undo'})
		).toBeInTheDocument();
		expect(
			screen.getByRole('button', {name: 'common.redo'})
		).toBeInTheDocument();
	});

	it('hides undo and redo buttons if CodeMirror is disabled in preferences', () => {
		renderComponent({prefs: {useCodeMirror: false}});
		expect(
			screen.queryByRole('button', {name: 'common.undo'})
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole('button', {name: 'common.redo'})
		).not.toBeInTheDocument();
	});

	it('is accessible', async () => {
		const {container} = await renderComponent();

		expect(await axe(container)).toHaveNoViolations();
	});
});
